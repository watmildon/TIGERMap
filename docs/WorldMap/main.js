function updateMapOnScroll()
{
    var filterTextBox = document.getElementById("filterTextBox");
    var filterText = filterTextBox.value;

    if (filterText.startsWith("(color)"))
    {
      addColorProperty(filterText.replace("(color)",""))
      return;
    }
    if (filterText.startsWith("(voronoi)"))
    {
      addVoronoi(filterText.replace("(voronoi)",""))
      return;
    }
}

function addVoronoi(attributeToVoronoi)
{
  const { featureCollection } = turf.helpers;

  var bounds = window.tigerMap.getBounds();

  var options = {
    bbox: [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
  };

  const [key, value] = attributeToVoronoi.split('=');

  const features  = map.queryRenderedFeatures();
  const filteredFeatures = features.filter((feat) => {
    return feat.properties && feat.properties[key] === value;
  });

  const mixedFeatures = {
    type: 'FeatureCollection',
    features: filteredFeatures.map((feat) => ({
      type: 'Feature',
      geometry: feat.geometry,
    })),
  };

  // Initialize arrays to store nodes and centroids
  const nodes = [];
  const centroids = [];
  
  // Iterate through the features
  mixedFeatures.features.forEach((feature) => {
    if (feature.geometry.type === 'Point') {
      // It's a node, keep it
      nodes.push(feature);
    } else if (feature.geometry.type === 'Polygon') {
      // only deal with simple polygons for now
    if (feature.geometry.coordinates.length == 1) {
      // Compute centroid for the polygon
      const centroid = turf.centroid(feature);
      centroids.push(centroid);
    }
    // Otherwise, skip this polygon (it has inner rings)
    }
    // Discard linestrings (ignore them)
  });

  // Create a new feature collection with nodes and centroids
  const onlyNodesCentroids = featureCollection([...nodes, ...centroids]);

  var voronoiPolygons = turf.voronoi(onlyNodesCentroids, options);
  const filteredVoronoiPolygons = voronoiPolygons.features.filter((feat) => feat !== null);

  const geojsonVoronoi = {
    type: 'FeatureCollection',
    features: filteredVoronoiPolygons.map((feat) => ({
      type: 'Feature',
      geometry: feat.geometry,
    })),
  };
  window.tigerMap.getSource("voronoi").setData(geojsonVoronoi);
}

function addColorProperty(propertyToColor)
{
  const featuresInBoundingBox = window.tigerMap.queryRenderedFeatures();

  window.map.setPaintProperty('osmcarto','raster-saturation',-1)
  // The eventual filter will look something like:
  //  "line-color": [
  //    "match",
  //    ["get", "maxspeed"],
  //    "5 mph", "lawngreen",
  //    "10 mph", "gold",
  //    "15 mph", "hotpink",
  //    "20 mph", "red",
  //    "25 mph", "green",
  //    "30 mph", "blue",
  //    "35 mph", "darkgreen",
  //    "40 mph", "purple",
  //    "45 mph", "teal",
  //    "50 mph", "maroon",
  //    "55 mph", "aqua",
  //    "60 mph", "darkcyan",
  //    "gray" // Default color if maxspeed doesn't match any known value
  //],
  var paintStyle = ["match",["get",propertyToColor]]
  const propUniq = [];
  for (const feature of featuresInBoundingBox) {
    var prop = feature.properties[propertyToColor];
    if (prop !== undefined){
      if (!propUniq.includes(prop)) {
        propUniq.push(prop);
      }
    }
  }

  for (const propVal of propUniq)
  {
    paintStyle.push(propVal);
    paintStyle.push(computeColor(propVal));
  }

  // add Default
  paintStyle.push("gray");

  map.setPaintProperty (
      'allFeatures',
      'line-color',
      paintStyle
  );

  map.setPaintProperty (
    'allFeatures-node',
    'circle-color',
    paintStyle
);
};


function computeColor(value) {
  // generated using https://mokole.com/palette.html
  var goodColors = ["#191970","#006400","#ff4500","#ffd700","#00ff00","#0000FF","#b0e0e6","#ff1493","#4b0082","#8b4513"]
  let hash = 0;
  let str = value.toString();

  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xfffffff; // Modulo to keep it within bounds
  }
  return goodColors[hash % goodColors.length]
}

  function setMapFilter(filterString) {
    var filterTextBox = document.getElementById("filterTextBox");
    filterTextBox.value = filterString;
    filterMap();
  }
  
  function filterMap() {
    var filterTextBox = document.getElementById("filterTextBox");
    var filterText = filterTextBox.value;

    if (filterText.startsWith("(color)"))
    {
      addColorProperty(filterText.replace("(color)",""))
      return;
    }
    if (filterText.startsWith("(voronoi)"))
    {
      filterText = filterText.replace("(voronoi)","");
      addVoronoi(filterText)
    }
    map.setPaintProperty ('allFeatures','line-color','#000000');
    map.setPaintProperty ('allFeatures-node','circle-color','#000000');
    map.setPaintProperty('osmcarto','raster-saturation',0)

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
        var filterPart = [separator,["to-string",["get", parts[0]]],parts[1]]
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

    var filterTextBox = document.getElementById("filterTextBox");
    filterTextBox.value = "";

    // clear filter example radio buttons
    var radioButtonNames = ["benchBackrestRadio",
                            "bicycleRepairRadio",
                            "pitchLitRadio",
                            "pitchSportRadio",
                            "addrStreetRadio",
                            "buildingTypeRadio",
                            "busShelterRadio",
                            "restaurantTakeoutRadio",
                            "separateSidewalkRadio",
                            "colorExploreRadio"];

    for (const buttonName of radioButtonNames)
    {
      var radio = document.getElementById(buttonName);
      radio.checked = false;
    }

    //paint: {
    //  "line-color": "#000000",
    //  "line-width": 2,
    //},
    map.setPaintProperty ('allFeatures','line-color','#000000');
    map.setPaintProperty ('allFeatures-node','circle-color','#000000');
    map.setPaintProperty('osmcarto','raster-saturation',0);

    const emptyGeoJson = {
      "type": "FeatureCollection",
      "features": [
      ]
    };

    window.tigerMap.getSource("voronoi").setData(emptyGeoJson);
  }
  