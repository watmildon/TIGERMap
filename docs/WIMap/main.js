// WIMap Main - Filter and Layer Management with Experimental Features
// Uses shared libraries: filter-parser.js, map-utils.js, experimental-features.js

// Create filter parser instance with WIMap-specific config
const filterParser = new FilterParser({
  autoAppendTigerReviewed: false,
  targetLayers: ['allFeatures', 'allFeatures-node']
});

// Experimental feature handlers
function updateMapOnScroll() {
  const filterTextBox = document.getElementById("filterTextBox");
  const filterText = filterTextBox.value;

  if (filterText.startsWith("(color)")) {
    ExperimentalFeatures.addColorProperty(window.tigerMap, filterText.replace("(color)", ""), ['allFeatures', 'allFeatures-node']);
    return;
  }
  if (filterText.startsWith("(voronoi)")) {
    ExperimentalFeatures.addVoronoi(window.tigerMap, filterText.replace("(voronoi)", ""));
    return;
  }
}

function setMapFilter(filterString) {
  const filterTextBox = document.getElementById("filterTextBox");
  filterTextBox.value = filterString;
  filterMap();
}

function filterMap() {
  const filterTextBox = document.getElementById("filterTextBox");
  const filterText = filterTextBox.value;

  // Handle experimental features
  if (filterText.startsWith("(color)")) {
    ExperimentalFeatures.addColorProperty(window.tigerMap, filterText.replace("(color)", ""), ['allFeatures', 'allFeatures-node']);
    return;
  }
  if (filterText.startsWith("(voronoi)")) {
    const cleanFilter = filterText.replace("(voronoi)", "");
    ExperimentalFeatures.addVoronoi(window.tigerMap, cleanFilter);
    return;
  }

  // Reset colors when applying regular filter
  ExperimentalFeatures.resetColors(window.tigerMap, ['allFeatures', 'allFeatures-node'], '#000000');

  if (filterText === "") {
    clearFilter();
    return;
  }

  // Use shared filter parser
  filterParser.applyFilter(filterText, window.tigerMap);
}

function clearFilter() {
  filterParser.clearFilter(window.tigerMap);

  // Clear filter example radio buttons
  const radioButtonNames = [
    "benchBackrestRadio",
    "bicycleRepairRadio",
    "pitchLitRadio",
    "pitchSportRadio",
    "addrStreetRadio",
    "buildingTypeRadio",
    "busShelterRadio",
    "restaurantTakeoutRadio",
    "separateSidewalkRadio",
    "colorExploreRadio"
  ];

  for (const buttonName of radioButtonNames) {
    const radio = document.getElementById(buttonName);
    if (radio) {
      radio.checked = false;
    }
  }

  // Reset experimental features
  ExperimentalFeatures.resetColors(window.tigerMap, ['allFeatures', 'allFeatures-node'], '#000000');
  ExperimentalFeatures.clearVoronoi(window.tigerMap);
}
