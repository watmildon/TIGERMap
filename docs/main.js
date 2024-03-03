function updateMapLayers(checkboxId,layerName) {
    var checkBox = document.getElementById(checkboxId);
    
    if (checkBox.checked == true){
        window.tigerMap.setLayoutProperty(layerName, 'visibility', 'visible');
    } else {
        window.tigerMap.setLayoutProperty(layerName, 'visibility', 'none');
    }
  }