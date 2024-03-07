#!/bin/bash
set -o errexit -o nounset
cd "$(dirname "$0")"

echo "Starting dl_osm_data_updates.sh"

if [ ! -s us-latest.osm.pbf ] ; then
	echo "No us-latest.osm.pbf, downloading.."
	curl -O https://download.geofabrik.de/north-america/us-latest.osm.pbf
fi
echo "us-latest.osm.pbf, size: $(ls -lh us-latest.osm.pbf | cut -d" " -f5)"
# quick shortcut for when we run this a log
if [ $(( $(date +%s) - $(stat -c %Y us-latest.osm.pbf) )) -lt 600 ] ; then
	exit 0
fi

SECONDS=0
LAST_TIMESTAMP=$(osmium fileinfo -g header.option.timestamp us-latest.osm.pbf)
if [ -z "$LAST_TIMESTAMP" ] ; then
	LAST_TIMESTAMP=$(osmium fileinfo --no-progress -e -g data.timestamp.last  us-latest.osm.pbf)
fi
echo "Current latest timestamp in file is $LAST_TIMESTAMP"

TMP=$(mktemp -p . "tmp.planet.XXXXXX.osm.pbf")
if [ $(( $(date +%s) - "$(date -d "$LAST_TIMESTAMP" +%s)" )) -gt "$(units -t 2days sec)" ] ; then
	echo "Downloading per-day updates.."
       pyosmium-up-to-date -v --ignore-osmosis-headers --server https://download.geofabrik.de/north-america/us-updates/ -s 10000 us-latest.osm.pbf
fi

echo "Took $SECONDS sec ( $(units "${SECONDS}sec" time) ) to download data updates from geofabrik"