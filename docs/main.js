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
    var filterText = filterTextBox.value;
    
    if (filterText.includes('='))
    {
        var kvp = filterText.split("=");
        if (filterText.includes(','))
        {
            // surface=paved,asphalt
            // "filter": ["match", ["get", "surface"], ["paved", "asphalt"], true, false]
            var values = kvp[1].split(',');
            
            if (values.length == 2)
            {
                window.tigerMap.setFilter('tigerReview', ['match', ['get', kvp[0]], [values[0],values[1]],true,false]);
            }
            if (values.length == 3)
            {
                window.tigerMap.setFilter('tigerReview', ['match', ['get', kvp[0]], [values[0],values[1],values[2]],true,false]);
            }
            if (values.length == 4)
            {
                window.tigerMap.setFilter('tigerReview', ['match', ['get', kvp[0]], [values[0],values[1],values[2],values[3]],true,false]);
            }
            if (values.length == 5)
            {
                window.tigerMap.setFilter('tigerReview', ['match', ['get', kvp[0]], [values[0],values[1],values[2],values[3],values[4]],true,false]);
            }
        }
        else
        {
            if (kvp[1] = "*")
            {
                window.tigerMap.setFilter('tigerReview', ["has",kvp[0]]);
            }
            else
            {
                window.tigerMap.setFilter('tigerReview', ['all', ['==', kvp[0], kvp[1]]]);
            }
            window.tigerMap.setLayoutProperty('tigerReview', 'visibility', 'visible');
        }
    }
    else
    {
        window.tigerMap.setFilter('tigerReview', ["has",filterText]);
    }
  }

  function clearFilter() {

    window.tigerMap.setFilter('tigerReview', null);

    window.tigerMap.setLayoutProperty('tigerReview', 'visibility', 'visible');
  }