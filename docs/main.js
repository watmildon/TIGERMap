// TIGERMap Main - Filter and Layer Management
// Uses shared libraries: filter-parser.js, map-utils.js, experimental-features.js

// Create filter parser instance with TIGERMap-specific config
const filterParser = new FilterParser({
  autoAppendTigerReviewed: true,
  targetLayers: ['tigerReview']
});

// Overlay checkboxes and the map layer each one controls.
// Their checked state is kept in the `layers` URL parameter.
const OVERLAY_LAYERS = {
  tigerCheckbox: "tigerReview",
  tigerRailCheckbox: "tigerReview-rail",
  tigerPipelineCheckbox: "tigerReview-pipeline",
  tigerPowerCheckbox: "tigerReview-power",
  housenumberCheckbox: "streetaddress",
  NADCheckbox: "NAD",
  countiesCheckbox: "counties",
  redlinedCheckbox: "redlined",
  eclipseCheckbox: "EclipseCenterline",
  roarCheckbox: "roar",
};

function applyLayerVisibility(checkboxId, layerName) {
  MapUtils.updateLayerVisibility(window.tigerMap, checkboxId, layerName);

  // Handle associated layers
  if (layerName === "streetaddress") {
    MapUtils.updateLayerVisibility(window.tigerMap, checkboxId, "streetaddress-node");
  }
  if (layerName === "EclipseCenterline") {
    MapUtils.updateLayerVisibility(window.tigerMap, checkboxId, "penumbra");
  }
  if (layerName === "roar") {
    MapUtils.updateLayerVisibility(window.tigerMap, checkboxId, "roar-dash");
    const legend = document.getElementById("roarLegend");
    if (legend) legend.hidden = !document.getElementById(checkboxId).checked;
    updateRoarCounts();
  }
}

function updateMapLayers(checkboxId, layerName) {
  applyLayerVisibility(checkboxId, layerName);
  MapUtils.updateLayersURL(Object.keys(OVERLAY_LAYERS));
}

// Check the overlays named in the URL, then match the map to the checkboxes
// once its layers exist. Syncing every checkbox also covers browsers that
// restore form state on reload.
function initLayersFromURL(map) {
  MapUtils.initLayersFromURL(Object.keys(OVERLAY_LAYERS));
  map.on("load", () => {
    for (const [checkboxId, layerName] of Object.entries(OVERLAY_LAYERS)) {
      applyLayerVisibility(checkboxId, layerName);
    }
  });
}

// TIGER ROAR legend: one row per verdict (see ROAR_VERDICTS in mapstyle.js),
// each toggling that verdict on the roar layer. The enabled set is kept in the
// `roar` URL parameter whenever it is not every verdict.
function roarEnabledVerdicts() {
  return ROAR_VERDICTS.map(v => v.verdict)
    .filter(verdict => document.getElementById("roar-" + verdict)?.checked);
}

// Legend category of a rendered feature's properties; matches ROAR_CATEGORY.
function roarCategory(props) {
  const verdict = props["roar:verdict"];
  const kind = props["roar:suggestion_kind"];
  if (verdict === "alignment_verified" && kind) {
    return kind === "directional" ? "alignment_directional" : "alignment_suggestion";
  }
  if (verdict === "suggestion_only" && kind === "directional") return "directional_suggestion";
  return verdict;
}

function applyRoarFilter() {
  const enabled = roarEnabledVerdicts();
  const filter = enabled.length === ROAR_VERDICTS.length
    ? null
    : ["in", ROAR_CATEGORY, ["literal", enabled]];
  try {
    window.tigerMap.setFilter("roar", filter);
    window.tigerMap.setFilter("roar-dash", filter ? ["all", ROAR_DASH_FILTER, filter] : ROAR_DASH_FILTER);
  } catch (e) {
    console.warn("Could not set filter on layer roar:", e);
  }
}

function updateRoarVerdicts() {
  applyRoarFilter();
  const enabled = roarEnabledVerdicts();
  const url = new URL(window.location.href);
  if (enabled.length === ROAR_VERDICTS.length) {
    url.searchParams.delete("roar");
  } else {
    url.searchParams.set("roar", enabled.join(","));
  }
  window.history.replaceState({}, "", url.toString());
}

function setAllRoarVerdicts(checked) {
  for (const v of ROAR_VERDICTS) {
    document.getElementById("roar-" + v.verdict).checked = checked;
  }
  updateRoarVerdicts();
}

// Swatch fill: the colour, or alternating colour/dash stripes like the map line.
function roarSwatchBackground(v) {
  return v.dash
    ? `repeating-linear-gradient(90deg, ${v.color} 0 .3rem, ${v.dash} .3rem .6rem)`
    : v.color;
}

// Info bubble linking out from a legend row. A link inside the label opens
// the page without toggling the checkbox.
function roarInfoLink(info) {
  if (!info) return "";
  return `<a class="link-info ms-1 d-inline-flex align-items-center" href="${info.url}" target="_blank" rel="noopener" title="${info.title}">` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">` +
    `<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>` +
    `<path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>` +
    `</svg></a>`;
}

// Build the legend rows, restore the enabled verdicts from the URL, and apply
// the filter once the roar layer exists.
function initRoarLegend(map) {
  const list = document.getElementById("roarLegendList");
  if (!list) return;
  const param = new URLSearchParams(window.location.search).get("roar");
  const wanted = param === null
    ? null
    : new Set(param.split(",").map(s => s.trim()).filter(Boolean));

  for (const v of ROAR_VERDICTS) {
    const id = "roar-" + v.verdict;
    const row = document.createElement("div");
    row.className = "form-check roar-legend-row";
    row.innerHTML =
      `<input class="form-check-input" type="checkbox" id="${id}">` +
      `<label class="form-check-label user-select-none d-flex align-items-center" for="${id}">` +
      `<span class="roar-swatch" style="background:${roarSwatchBackground(v)}"></span>` +
      `<span class="flex-fill d-inline-flex align-items-center">${v.label}${roarInfoLink(v.info)}</span>` +
      `<span class="roar-count ms-3 text-body-secondary" id="roar-count-${v.verdict}"></span></label>`;
    list.appendChild(row);
    const box = row.querySelector("input");
    box.checked = wanted === null || wanted.has(v.verdict);
    box.addEventListener("change", updateRoarVerdicts);
    // Hovercard with what the verdict means
    new bootstrap.Tooltip(row, {
      title: v.description,
      placement: "right",
      customClass: "roar-tooltip",
    });
  }
  map.on("load", applyRoarFilter);
  map.on("idle", updateRoarCounts);

  // Nationwide totals, written by the ROAR pipeline next to the tileset.
  fetch(MapUtils.getUrlPrefix() + "us-roar-counts.json")
    .then(r => r.ok ? r.json() : null)
    .then(totals => { roarTotals = totals; updateRoarCounts(); })
    .catch(() => {});
}

// Per-category US totals, split like ROAR_CATEGORY, from the verdict x
// suggestion-kind table in us-roar-counts.json. Without that table the split
// rows have no total and the verdict rows show their whole verdict.
function roarCategoryTotals(t) {
  const out = { ...t.verdicts };
  const vs = t.verdict_suggestions;
  if (!vs) return out;
  const sum = cells => Object.values(cells || {}).reduce((a, b) => a + b, 0);
  const align = vs.alignment_verified || {};
  const only = vs.suggestion_only || {};
  out.alignment_verified = align.none || 0;
  out.alignment_directional = align.directional || 0;
  out.alignment_suggestion = sum(align) - out.alignment_verified - out.alignment_directional;
  out.directional_suggestion = only.directional || 0;
  out.suggestion_only = sum(only) - out.directional_suggestion;
  return out;
}

let roarTotals = null; // { data_timestamp, total, verdicts: {verdict: n}, ... }

// Roads in view per verdict. Only at the tileset's max zoom and closer: below
// it tippecanoe has dropped features, so a count would be wrong. Features come
// from the loaded tiles, which can extend past the viewport, and a road split
// across tiles appears once per tile, so clip to the view and dedupe by id.
const ROAR_COUNT_MIN_ZOOM = 11;

function updateRoarCounts() {
  const legend = document.getElementById("roarLegend");
  if (!legend || legend.hidden) return;
  const map = window.tigerMap;
  const note = document.getElementById("roarLegendNote");
  const setCount = (verdict, text) => {
    const el = document.getElementById("roar-count-" + verdict);
    if (el) el.textContent = text;
  };

  const setNote = (text) => { if (note) note.textContent = text; };

  if (map.getZoom() < ROAR_COUNT_MIN_ZOOM) {
    // Tiles are thinned here, so show the nationwide totals instead.
    if (roarTotals) {
      const totals = roarCategoryTotals(roarTotals);
      for (const v of ROAR_VERDICTS) setCount(v.verdict, totals[v.verdict]?.toLocaleString() ?? "");
      const day = (roarTotals.data_timestamp || "").slice(0, 10);
      setNote(`US totals${day ? " as of " + day : ""}: ${roarTotals.total.toLocaleString()} roads. ` +
              "Zoom to 11+ for counts in view.");
    } else {
      for (const v of ROAR_VERDICTS) setCount(v.verdict, "");
      setNote("Counts in view at zoom 11+");
    }
    return;
  }

  const bounds = map.getBounds();
  const inView = (geometry) => {
    const lines = geometry.type === "MultiLineString" ? geometry.coordinates : [geometry.coordinates];
    return lines.some(line => line.some(([lng, lat]) => bounds.contains([lng, lat])));
  };
  const counts = {};
  const seen = new Set();
  for (const f of map.querySourceFeatures("roar", { sourceLayer: "roar" })) {
    const id = f.properties["@id"];
    if (seen.has(id) || !inView(f.geometry)) continue;
    seen.add(id);
    const category = roarCategory(f.properties);
    counts[category] = (counts[category] || 0) + 1;
  }
  for (const v of ROAR_VERDICTS) setCount(v.verdict, (counts[v.verdict] || 0).toLocaleString());
  setNote(roarTotals
    ? `In view. US total ${roarTotals.total.toLocaleString()} roads.`
    : "In view");
}

// TIGER layers the "Last edited" filter applies to. The text filter applies
// only to the first (the tiger:reviewed=no roads).
const TIGER_LAYERS = ["tigerReview", "tigerReview-rail", "tigerReview-pipeline", "tigerReview-power"];

// "Last edited" presets: URL value -> [comparison, age before now]
const EDITED_PRESETS = {
  "last-7d": [">=", "7d"],
  "last-30d": [">=", "30d"],
  "last-1y": [">=", "1y"],
  "over-5y": ["<", "5y"],
  "over-10y": ["<", "10y"],
};

let activeTextFilter = ""; // the text filter last applied, not just typed
let mapStyleLoaded = false;

function editedCondition() {
  const preset = EDITED_PRESETS[document.getElementById("editedSelect")?.value];
  if (!preset) return null;
  const [op, age] = preset;
  return FilterParser.timestampCondition(op, FilterParser.parseTimeValue(age));
}

// Set each TIGER layer's filter: its style filter (for the road layer, the
// text filter when one is applied) combined with the "Last edited" choice.
function applyTigerFilters() {
  if (!mapStyleLoaded) return; // the map's load handler applies them
  const edited = editedCondition();

  for (const layer of TIGER_LAYERS) {
    const base = layer === "tigerReview" && activeTextFilter
      ? filterParser.parseFilter(activeTextFilter)
      : mapstyle_layers.find(l => l.id === layer).filter;
    try {
      window.tigerMap.setFilter(layer, edited ? ["all", base, edited] : base);
    } catch (e) {
      console.warn(`Could not set filter on layer ${layer}:`, e);
    }
  }
}

function setEditedFilter() {
  const value = document.getElementById("editedSelect").value;
  const url = new URL(window.location.href);
  if (value) {
    url.searchParams.set("edited", value);
  } else {
    url.searchParams.delete("edited");
  }
  window.history.replaceState({}, "", url.toString());
  applyTigerFilters();
}

// Restore the "Last edited" choice from the URL, and apply all filters once
// the map's layers exist (a filter from the URL may be read before that).
function initFiltersOnLoad(map) {
  const edited = new URLSearchParams(window.location.search).get("edited");
  const select = document.getElementById("editedSelect");
  if (select && edited in EDITED_PRESETS) select.value = edited;

  map.on("load", () => {
    mapStyleLoaded = true;
    applyTigerFilters();
  });
}

function filterMap() {
  const filterTextBox = document.getElementById("filterTextBox");
  const filterText = filterTextBox.value;

  // Handle experimental features
  if (filterText.startsWith("(color)")) {
    const property = filterText.replace("(color)", "");
    ExperimentalFeatures.addColorProperty(window.tigerMap, property, ['tigerReview']);
    return;
  }
  if (filterText.startsWith("(voronoi)")) {
    const filter = filterText.replace("(voronoi)", "");
    ExperimentalFeatures.addVoronoi(window.tigerMap, filter);
    return;
  }

  // Reset colors when applying regular filter
  ExperimentalFeatures.resetColors(window.tigerMap, ['tigerReview'], '#000000');

  if (filterText === "") {
    clearFilter();
    return;
  }

  filterParser.updateURL(filterText);
  activeTextFilter = filterText;
  applyTigerFilters();
}

function clearFilter() {
  // Clears the URL parameter and text box only; filters are rebuilt below
  filterParser.clearFilter(window.tigerMap, []);
  activeTextFilter = "";
  applyTigerFilters();
  window.tigerMap.setLayoutProperty("tigerReview", "visibility", "visible");

  // Reset experimental features
  ExperimentalFeatures.resetColors(window.tigerMap, ['tigerReview'], '#000000');
  ExperimentalFeatures.clearVoronoi(window.tigerMap);
}
