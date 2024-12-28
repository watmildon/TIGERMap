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
  

    // Add default tiger reviewed status to the filter set
    // folks may wish to view other values of tiger:reviewed
    // but the main layer should generally be "no"
    // 
    // This is kinda a hack imo but oh well
    if (!filterText.includes("tiger:reviewed")) {
      filterText = filterText.concat(";tiger:reviewed=no");
    }

    // key1;key2;key3...
    // !key1;key2...
    // key1=value
    // key=value
    // key!=value
    // ["all", ["==", key, value]]
    // key1;key2=value2
    // ["all",["has",key1],["all",["==",key2,value2]]]
    // surface=paved,asphalt
    // "filter": ["match", ["get", "surface"], ["paved", "asphalt"], true, false]
    // surface!=paved,asphalt
    // "filter": ["match", ["get", "surface"], ["paved", "asphalt"], false, true]
    //
    // Filter doc: https://maplibre.org/maplibre-style-spec/expressions

    filterText = filterText.replace("=*",""); // convert key=* to key

    var keyParts = filterText.split(";");
    var filterArray = ["all"];
    for (const part of keyParts)
    {
      if (part.includes("!="))
      {
        var parts = part.split("!=");
        if (parts[1].includes(","))
        {
          parts[1] = parts[1].split(",");
        }

        var filterPart = ["match",["to-string",["get", parts[0]]],parts[1],false,true]
        filterArray.push(filterPart);
      }
      else if (part.includes("<") || part.includes(">"))
      {
        var separator = /([<>=]+)/.exec(part)[1];
        var parts = part.split(separator);
        if (parts[1].includes(","))
        {
          parts[1] = parts[1].split(",");
        }
        var filterPart = [separator,["to-number",["get", parts[0]]],["to-number",parts[1]]]
        filterArray.push(filterPart);
      }
      else if (part.includes("="))
      {
        var parts = part.split("=");
        if (parts[1].includes(","))
        {
          parts[1] = parts[1].split(",");
        }

        var filterPart = ["match",["to-string",["get", parts[0]]],parts[1],true,false]
        filterArray.push(filterPart);
      }
      else
      {
        if (part[0] === "!")
        {
          filterArray.push(['!',["has", part.substring(1)]]);
        }
        else
        {
          filterArray.push(["has", part]);
        }
      }
    }
    window.tigerMap.setFilter("tigerReview", filterArray)
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
    var filterTextBox = document.getElementById("filterTextBox");
    filterTextBox.value = "";
  }
  