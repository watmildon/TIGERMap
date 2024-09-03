var mapstyle_layers = [
  {
    id: "osmcarto",
    type: "raster",
    source: "osmcarto",
  },
  {
    id: "allFeatures",
    type: "line",
    paint: {
      "line-color": "#000000",
      "line-width": 2,
    },
    "layout": {
      "line-cap": "round",
      "line-join": "round",
      "visibility": "visible"
    },
    source: "WAMap",
    "source-layer": "osm",
  },
  {
    id: "allFeatures-node",
    type: "circle",
    paint: {
      "circle-color": "#000000",
      "circle-radius":4,
    },
    "layout": {
      "visibility": "visible"
    },
    source: "WAMap",
    "source-layer": "osm",
    filter: ["==", ["get", "@type"], "node"]
  },
  {
    id: "highlight",
    type: "line",
    paint: {
      "line-color":  "#f5812f",
      "line-width": 5,
    },
    "layout": {
      "line-cap": "round",
      "line-join": "round",
      "visibility": "visible"
    },
    source: "highlight"
  },
  {
    id: "voronoi",
    type: "line",
    paint: {
      "line-color":  "#000000",
      "line-width": 5,
    },
    "layout": {
      "line-cap": "round",
      "line-join": "round",
      "visibility": "visible"
    },
    source: "voronoi"
  }
];
