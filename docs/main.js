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
