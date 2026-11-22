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

  filterParser.applyFilter(filterText, window.tigerMap);
}

function clearFilter() {
  filterParser.clearFilter(window.tigerMap);
  window.tigerMap.setLayoutProperty("tigerReview", "visibility", "visible");

  // Reset experimental features
  ExperimentalFeatures.resetColors(window.tigerMap, ['tigerReview'], '#000000');
  ExperimentalFeatures.clearVoronoi(window.tigerMap);
}
