  function filterMap() {
    var filterTextBox = document.getElementById("filterTextBox");
    var filterText = filterTextBox.value;
  
    if (filterText === "") {
      clearFilter();
      return;
    }
  
    if (filterText.includes("=")) {
      var kvp = filterText.split("=");
      if (filterText.includes(",")) {
        // surface=paved,asphalt
        // "filter": ["match", ["get", "surface"], ["paved", "asphalt"], true, false]
        var values = kvp[1].split(",");
  
        if (values.length == 2) {
          window.tigerMap.setFilter("allFeatures", ["match", ["get", kvp[0]], [values[0], values[1]], true, false]);
          window.tigerMap.setFilter("allFeatures-node", ["match", ["get", kvp[0]], [values[0], values[1]], true, false]);
        }
        if (values.length == 3) {
          window.tigerMap.setFilter("allFeatures", ["match", ["get", kvp[0]], [values[0], values[1], values[2]], true, false]);
          window.tigerMap.setFilter("allFeatures-node", ["match", ["get", kvp[0]], [values[0], values[1], values[2]], true, false]);
        }
        if (values.length == 4) {
          window.tigerMap.setFilter("allFeatures", ["match", ["get", kvp[0]], [values[0], values[1], values[2], values[3]], true, false]);
          window.tigerMap.setFilter("allFeatures-node", ["match", ["get", kvp[0]], [values[0], values[1], values[2], values[3]], true, false]);
        }
        if (values.length == 5) {
          window.tigerMap.setFilter("allFeatures", ["match", ["get", kvp[0]], [values[0], values[1], values[2], values[3], values[4]], true, false]);
          window.tigerMap.setFilter("allFeatures-node", ["match", ["get", kvp[0]], [values[0], values[1], values[2], values[3], values[4]], true, false]);
        }
      } else {
        if (kvp[1] === "*") {
          window.tigerMap.setFilter("allFeatures", ["has", kvp[0]]);
          window.tigerMap.setFilter("allFeatures-node", ["has", kvp[0]]);
        } else {
          window.tigerMap.setFilter("allFeatures", ["all", ["==", kvp[0], kvp[1]]]);
          window.tigerMap.setFilter("allFeatures-node", ["all", ["==", kvp[0], kvp[1]]]);
        }
        window.tigerMap.setLayoutProperty("allFeatures", "visibility", "visible");
        window.tigerMap.setLayoutProperty("allFeatures-node", "visibility", "visible");
      }
    } else {
      if (filterText[0] === "-") {
        window.tigerMap.setFilter("allFeatures", ["!", ["has", filterText.substring(1)]]);
        window.tigerMap.setFilter("allFeatures-node", ["!", ["has", filterText.substring(1)]]);
      } else {
        window.tigerMap.setFilter("allFeatures", ["has", filterText]);
        window.tigerMap.setFilter("allFeatures-node", ["has", filterText]);
      }
    }
  }
  
  function clearFilter() {
    window.tigerMap.setFilter("allFeatures", null);
    window.tigerMap.setFilter("allFeatures-node", null);
  
    window.tigerMap.setLayoutProperty("allFeatures", "visibility", "visible");
    window.tigerMap.setLayoutProperty("allFeatures-node", "visibility", "visible");
  }
  