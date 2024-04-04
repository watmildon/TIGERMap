function updateMapLayers(checkboxId, layerName) {
    var checkBox = document.getElementById(checkboxId);
  
    if (checkBox.checked == true) {
      window.tigerMap.setLayoutProperty(layerName, "visibility", "visible");
      if (layerName === "streetaddress") {
        window.tigerMap.setLayoutProperty("streetaddress-node", "visibility", "visible");
      }
      if (layerName === "EclipseCenterline") {
        window.tigerMap.setLayoutProperty("penumbra", "visibility", "visible");
      }
    } else {
      window.tigerMap.setLayoutProperty(layerName, "visibility", "none");
      if (layerName === "streetaddress") {
        window.tigerMap.setLayoutProperty("streetaddress-node", "visibility", "none");
      }
      if (layerName === "EclipseCenterline") {
        window.tigerMap.setLayoutProperty("penumbra", "visibility", "none");
      }
    }
  }
  
  function filterMap() {
    var filterTextBox = document.getElementById("filterTextBox");
    var filterText = filterTextBox.value;
  
    if (filterText === "") {
      clearFilter();
      return;
    }

    // add filter to url
    var queryParams = new URLSearchParams(window.location.search);
    queryParams.set('filter', encodeURIComponent(filterTextBox.value));
    const newQueryString = queryParams.toString();
    const newURL = `${window.location.pathname}?${newQueryString}${window.location.hash}`;
    window.history.replaceState({}, '', newURL);
  
    if (filterText.includes("=")) {
      var kvp = filterText.split("=");
      if (filterText.includes(",")) {
        // surface=paved,asphalt
        // "filter": ["match", ["get", "surface"], ["paved", "asphalt"], true, false]
        var values = kvp[1].split(",");
  
        if (values.length == 2) {
          window.tigerMap.setFilter("tigerReview", ["match", ["get", kvp[0]], [values[0], values[1]], true, false]);
        }
        if (values.length == 3) {
          window.tigerMap.setFilter("tigerReview", ["match", ["get", kvp[0]], [values[0], values[1], values[2]], true, false]);
        }
        if (values.length == 4) {
          window.tigerMap.setFilter("tigerReview", ["match", ["get", kvp[0]], [values[0], values[1], values[2], values[3]], true, false]);
        }
        if (values.length == 5) {
          window.tigerMap.setFilter("tigerReview", ["match", ["get", kvp[0]], [values[0], values[1], values[2], values[3], values[4]], true, false]);
        }
      } else {
        if (kvp[1] === "*") {
          window.tigerMap.setFilter("tigerReview", ["has", kvp[0]]);
        } else {
          window.tigerMap.setFilter("tigerReview", ["all", ["==", kvp[0], kvp[1]]]);
        }
        window.tigerMap.setLayoutProperty("tigerReview", "visibility", "visible");
      }
    } else {
      // key1,-key2
      // ["all",["has","highway"],["!",["has","maxspeed"]]]
      if (filterText.includes(",")) {
        var values = filterText.split(",");
        if (values[1][0] === "-")
        {
          window.tigerMap.setFilter("tigerReview",["all",["has",values[0]],["!",["has",values[1].substring(1)]]]);
        }
        else
        {
          window.tigerMap.setFilter("tigerReview",["all",["has",values[0]],["has",values[1]]]);
        }
      } else {
        if (filterText[0] === "-") {
          window.tigerMap.setFilter("tigerReview", ["!", ["has", filterText.substring(1)]]);
        } else {
          window.tigerMap.setFilter("tigerReview", ["has", filterText]);
        }
      }
    }
  }
  
  function clearFilter() {
    //update the url
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    params.delete('filter');
    url.search = params.toString();
    const newURL = url.toString();
    window.history.replaceState({}, '', newURL);
  
    // modify the map layers
    window.tigerMap.setFilter("tigerReview", null);
  
    window.tigerMap.setLayoutProperty("tigerReview", "visibility", "visible");
  }
  