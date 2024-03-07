function updateMapLayers(checkboxId,layerName) {
    var checkBox = document.getElementById(checkboxId);
    
    if (checkBox.checked == true){
        window.tigerMap.setLayoutProperty(layerName, 'visibility', 'visible');
    } else {
        window.tigerMap.setLayoutProperty(layerName, 'visibility', 'none');
    }
  }

function filterMap() {
    var filterTextBox = document.getElementById("filterTextBox");
    
    var kvp = filterTextBox.value.split("=");

    window.tigerMap.setFilter('tigerReview', ['all', ['==', kvp[0], kvp[1]]]);

    window.tigerMap.setLayoutProperty('tigerReview', 'visibility', 'visible');
  }