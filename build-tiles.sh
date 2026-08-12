#!/bin/bash
# TIGERMap nightly tile build. Design rationale: PIPELINE-HARDENING.md.
#   exit 0  = built and published, or correctly skipped (no new upstream data)
#   exit >0 = something went wrong; nothing was published this run
#
# Suggested crontab (extra attempts are ~free thanks to the no-op gate):
#   TIGER_HEALTHCHECK_URL=https://hc-ping.com/<uuid>
#   0 4,11,18 * * * bash /home/watmildon/TIGERProject/build-tiles.sh
set -Eeuo pipefail
shopt -s nullglob

cd "$(dirname "$0")"
ROOT="$PWD"

# One run at a time: a second instance's cleanup would delete a live run's
# intermediates. flock releases the lock automatically if the holder dies.
if command -v flock >/dev/null 2>&1; then
    exec 9>"$ROOT/.build.lock"
    flock -n 9 || { echo "build-tiles.sh: another run holds .build.lock; exiting" >&2; exit 1; }
else
    echo "build-tiles.sh: WARN: flock not found; running without overlap protection" >&2
fi

STATE_DIR="$ROOT/state"; LOG_DIR="$ROOT/logs"
STAGE_DIR="$ROOT/staging"; TILE_DIR="$ROOT/tilesets"
mkdir -p "$STATE_DIR" "$LOG_DIR" "$STAGE_DIR" "$TILE_DIR"

RUN_ID=$(date -u +%Y-%m-%dT%H:%M:%SZ)
RUN_LOG="$LOG_DIR/run-$(date -u +%Y%m%dT%H%M%SZ).log"
START_EPOCH=$(date +%s)
STALE=0
FINISHED=0

exec > >(tee -a "$RUN_LOG") 2>&1
log()  { printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }
step() { log "=== $* ==="; }
die()  { log "FATAL: $*"; exit 1; }

EXPECTED=(us-latest.pmtiles us-latest-streetaddress.pmtiles
          washington-latest.pmtiles utah-latest.pmtiles wisconsin-latest.pmtiles)
# Safe to delete after a run. Never list the five source extracts here:
# us-latest.osm.pbf alone is a 12 GB re-download.
DERIVED=(us-latest-tiger.osm.pbf us-latest-addrstreet.osm.pbf
         puerto-rico-latest-tiger.osm.pbf puerto-rico-latest-addrstreet.osm.pbf)

HC="${TIGER_HEALTHCHECK_URL:-}"
ping_health() { [ -n "$HC" ] && curl -fsS -m 10 --retry 3 "$HC$1" -d "$2" >/dev/null || true; }

append_summary() {
  local status=$1 sizes='' f
  local dur=$(( $(date +%s) - START_EPOCH ))
  [ -s "$LOG_DIR/summary.tsv" ] || \
      printf 'run_utc\tstatus\tdata_ts\tseq_us\tus\taddr\twa\tut\twi\tdur\n' >> "$LOG_DIR/summary.tsv"
  for f in "${EXPECTED[@]}"; do
      # sizes are meaningful only for a run that actually published
      if [ "$status" = OK ]; then sizes+=$'\t'$(stat -c%s "$TILE_DIR/$f" 2>/dev/null || echo -)
      else sizes+=$'\t'-; fi
  done
  printf '%s\t%s\t%s\t%s%s\t%dm%ds\n' "$RUN_ID" "$status" "${DATA_TS:--}" \
      "${SEQ_US:--}" "$sizes" $((dur/60)) $((dur%60)) >> "$LOG_DIR/summary.tsv"
}

finish() {   # $1 = OK | SKIPPED | FAILED
  append_summary "$1"
  case "$1" in
    OK)      if [ "$STALE" = 1 ]; then ping_health /fail "built, but upstream data is stale"
             else ping_health "" "ok"; fi ;;
    SKIPPED) if [ "$STALE" = 1 ]; then ping_health /fail "upstream data stale for 48h+"
             else ping_health /log "no-op: upstream unchanged"; fi ;;
    FAILED)  ping_health /fail "$(tail -20 "$RUN_LOG" 2>/dev/null)" ;;
  esac
  log "run finished: $1"
  FINISHED=1
}

cleanup() { rm -f ./*.geojson ./*.pmtiles-journal ./*.osm.pbf.part "${DERIVED[@]}" "$STAGE_DIR"/*; }

# Every exit path lands here exactly once: a normal end already called finish;
# any other exit (die, set -e, signal) is a failure that must still be recorded.
on_exit() {
  rc=$?
  if [ "$FINISHED" = 0 ]; then
      log "run FAILED (exit $rc)"
      finish FAILED
  fi
  cleanup
}
trap on_exit EXIT
trap 'rc=$?; log "ERROR at line $LINENO (exit $rc): $BASH_COMMAND"' ERR

# ---------------------------------------------------------------- 1. preflight
step "STEP 1/8: preflight"
ping_health /start "$RUN_ID"
for tool in osmium tippecanoe rclone pyosmium-up-to-date curl; do
    command -v "$tool" >/dev/null || die "$tool not on PATH"
done
avail_gb=$(df -BG --output=avail "$ROOT" | tail -1 | tr -dc '0-9')
[ "${avail_gb:-0}" -ge 120 ] || die "only ${avail_gb}G free, need >=120G"
rclone lsd r2: >/dev/null 2>&1 || die "cannot reach r2: — expired credentials?"
rm -f "$STAGE_DIR"/*   # leftovers from a hard-killed run
find "$LOG_DIR" -maxdepth 1 -name 'run-*.log' | sort -r | tail -n +31 | xargs -r rm -f
log "preflight ok (${avail_gb}G free)"

# --------------------------------------------------------- 2. refresh extracts
step "STEP 2/8: download missing extracts"
fetch() {   # $1 = url, $2 = file; a partial download must never pass the -s check
  [ -s "$2" ] || {
      log "no $2, downloading"
      curl -fsSL --retry 3 --retry-delay 30 -o "$2.part" "$1" && mv "$2.part" "$2"
  }
}
GF=https://download.geofabrik.de/north-america
fetch $GF/us-latest.osm.pbf             us-latest.osm.pbf
fetch $GF/us/puerto-rico-latest.osm.pbf puerto-rico-latest.osm.pbf
fetch $GF/us/washington-latest.osm.pbf  washington-latest.osm.pbf
fetch $GF/us/utah-latest.osm.pbf        utah-latest.osm.pbf
fetch $GF/us/wisconsin-latest.osm.pbf   wisconsin-latest.osm.pbf

step "STEP 3/8: apply replication diffs"
update_extract() {   # $1 = file, $2 = replication server
  # pyosmium-up-to-date exit 1 means "applied diffs, more available upstream" —
  # a success that wants a re-run, not an error. Only >=2 is fatal.
  local rc=0
  pyosmium-up-to-date -v --server "$2" -s 10000 "$1" || rc=$?
  case "$rc" in
    0) ;;
    1) log "WARN: $1 partially updated; upstream has more data" ;;
    *) die "pyosmium-up-to-date failed for $1 (exit $rc)" ;;
  esac
}
update_extract us-latest.osm.pbf          $GF/us-updates
update_extract puerto-rico-latest.osm.pbf $GF/us/puerto-rico-updates
update_extract washington-latest.osm.pbf  $GF/us/washington-updates
update_extract utah-latest.osm.pbf        $GF/us/utah-updates
update_extract wisconsin-latest.osm.pbf   $GF/us/wisconsin-updates

# ------------------------------------------------------- 4. no-op / stale gate
step "STEP 4/8: freshness gate"
hdr() { osmium fileinfo -g "header.option.$2" "$1"; }
DATA_TS=$(hdr us-latest.osm.pbf timestamp)
SEQ_US=$(hdr us-latest.osm.pbf osmosis_replication_sequence_number)
TS_WA=$(hdr washington-latest.osm.pbf timestamp)
TS_UT=$(hdr utah-latest.osm.pbf       timestamp)
TS_WI=$(hdr wisconsin-latest.osm.pbf  timestamp)

age_h=$(( ( $(date -u +%s) - $(date -u -d "$DATA_TS" +%s) ) / 3600 ))
log "upstream data: $DATA_TS (sequence $SEQ_US, ${age_h}h old)"
if [ "$age_h" -ge 48 ]; then
    STALE=1
    log "ALERT: upstream data older than 48h — Geofabrik replication may be stalled"
fi

PREV_TS=$(cat "$STATE_DIR/last-data-timestamp" 2>/dev/null || echo none)
if [ "$DATA_TS" = "$PREV_TS" ] && [ "${FORCE_BUILD:-0}" != 1 ]; then
    log "NO-OP: data timestamp unchanged since last build; skipping rebuild (FORCE_BUILD=1 overrides)"
    finish SKIPPED
    exit 0
fi
log "data advanced: $PREV_TS -> $DATA_TS; building"

# --------------------------------------------------------------- 5. build tiles
TIPPE_COMMON=(-q -Q -zg --drop-densest-as-needed --extend-zooms-if-still-dropping)

step "STEP 5/8: TIGER-reviewed highways"
osmium tags-filter --remove-tags --overwrite us-latest.osm.pbf w/tiger:reviewed \
    -o us-latest-tiger.osm.pbf
osmium export --attributes type,id,version,timestamp --overwrite \
    us-latest-tiger.osm.pbf -o us-latest-tiger.geojson -i dense_file_array
osmium tags-filter --remove-tags --overwrite puerto-rico-latest.osm.pbf w/tiger:reviewed \
    -o puerto-rico-latest-tiger.osm.pbf
osmium export --attributes type,id,version,timestamp --overwrite \
    puerto-rico-latest-tiger.osm.pbf -o puerto-rico-latest-tiger.geojson
tippecanoe "${TIPPE_COMMON[@]}" -l highways -o "$STAGE_DIR/us-latest.pmtiles" \
    us-latest-tiger.geojson puerto-rico-latest-tiger.geojson -N "$DATA_TS"
log "built us-latest.pmtiles ($(stat -c%s "$STAGE_DIR/us-latest.pmtiles") bytes)"

step "STEP 6/8: addr:street"
osmium tags-filter --remove-tags --overwrite us-latest.osm.pbf nwr/addr:street \
    -o us-latest-addrstreet.osm.pbf
osmium export --overwrite us-latest-addrstreet.osm.pbf -o us-latest-addrstreet.geojson
# PR addr:street comes from the FULL extract, not the tiger-filtered one, which
# left Puerto Rico ~absent from this layer (PIPELINE-HARDENING.md, Appendix A)
osmium tags-filter --remove-tags --overwrite puerto-rico-latest.osm.pbf nwr/addr:street \
    -o puerto-rico-latest-addrstreet.osm.pbf
osmium export --overwrite puerto-rico-latest-addrstreet.osm.pbf \
    -o puerto-rico-latest-addrstreet.geojson
tippecanoe "${TIPPE_COMMON[@]}" -l streetaddress \
    -o "$STAGE_DIR/us-latest-streetaddress.pmtiles" \
    us-latest-addrstreet.geojson puerto-rico-latest-addrstreet.geojson -N "$DATA_TS"
log "built us-latest-streetaddress.pmtiles ($(stat -c%s "$STAGE_DIR/us-latest-streetaddress.pmtiles") bytes)"

step "STEP 7/8: state layers"
build_state() {   # $1 = state name, $2 = its data timestamp
  osmium export --attributes type,id,version,timestamp --overwrite \
      "$1-latest.osm.pbf" -o "$1-latest.geojson"
  tippecanoe "${TIPPE_COMMON[@]}" -l allFeatures -o "$STAGE_DIR/$1-latest.pmtiles" \
      "$1-latest.geojson" -N "$2"
  log "built $1-latest.pmtiles ($(stat -c%s "$STAGE_DIR/$1-latest.pmtiles") bytes)"
}
build_state washington "$TS_WA"
build_state utah       "$TS_UT"
build_state wisconsin  "$TS_WI"

# ------------------------------------------------------ 8. verify and publish
step "STEP 8/8: verify, publish, upload"
for f in "${EXPECTED[@]}"; do
    [ -s "$STAGE_DIR/$f" ] || die "missing or empty output: $f"
    new=$(stat -c%s "$STAGE_DIR/$f")
    prev=$(cat "$STATE_DIR/size-$f" 2>/dev/null || echo 0)
    if [ "$prev" -gt 0 ] && [ "$new" -lt $(( prev * 80 / 100 )) ]; then
        die "$f shrank >20% ($new vs $prev bytes) — refusing to publish"
    fi
done
for f in "${EXPECTED[@]}"; do
    mv -f "$STAGE_DIR/$f" "$TILE_DIR/$f"
    stat -c%s "$TILE_DIR/$f" > "$STATE_DIR/size-$f"
done

printf '{"build_utc":"%s","data_timestamp":"%s","us_sequence":%s,"status":"ok"}\n' \
    "$RUN_ID" "$DATA_TS" "${SEQ_US:-null}" > "$STAGE_DIR/status.json"

# copy, never sync: a local mishap must not delete live tiles from R2
rclone copy --transfers 1 --order-by size,descending --bwlimit 10M \
    -v --stats 5m --stats-one-line --stats-log-level NOTICE \
    "$TILE_DIR" r2:tiger-map
rclone copyto "$STAGE_DIR/status.json" r2:tiger-map/status.json \
    --header-upload "Cache-Control: no-store"

remote=$(rclone lsl r2:tiger-map)
for f in "${EXPECTED[@]}"; do
    want=$(stat -c%s "$TILE_DIR/$f")
    have=$(printf '%s\n' "$remote" | awk -v f="$f" '$NF == f {print $1}')
    [ "$want" = "$have" ] || die "remote size mismatch for $f: local=$want remote=${have:-absent}"
done
log "verified ${#EXPECTED[@]} tilesets in R2"

echo "$DATA_TS" > "$STATE_DIR/last-data-timestamp"
finish OK
