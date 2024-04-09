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
  
    // key1;key2;key3...
    // -key1;key2...
    // key1=value
    // key=value
    // key!=value
    // ["all", ["==", key, value]]
    // key1;key2=value2
    // ["all",["has",key1],["all",["==",key2,value2]]]

    // TODO
    // surface=paved,asphalt
    // "filter": ["match", ["get", "surface"], ["paved", "asphalt"], true, false]

    filterText = filterText.replace("=*",""); // convert key=* to key

    var keyParts = filterText.split(";");
    var filterArray = ["all"];
    for (const part of keyParts)
    {
      if (part.includes("!="))
      {
        var parts = part.split("!=");
        var filterPart = ["all",["!=", parts[0], parts[1]]]
        filterArray.push(filterPart);
      }
      else if (part.includes("="))
      {
        var parts = part.split("=");
        var filterPart = ["all",["==", parts[0], parts[1]]]
        filterArray.push(filterPart);
      }
      else
      {
        if (part[0] === "!")
        {
          filterArray.push(["!has", part.substring(1)]);
        }
        else
        {
          filterArray.push(["has", part]);
        }
      }
    }

    window.tigerMap.setFilter("allFeatures", filterArray)
    window.tigerMap.setFilter("allFeatures-node", filterArray)
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
    window.tigerMap.setFilter("allFeatures", null);
    window.tigerMap.setFilter("allFeatures-node", null);
  
    window.tigerMap.setLayoutProperty("allFeatures", "visibility", "visible");
    window.tigerMap.setLayoutProperty("allFeatures-node", "visibility", "visible");
  }
  