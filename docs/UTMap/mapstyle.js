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
    "source-layer": "allFeatures",
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
    "source-layer": "allFeatures",
    filter: ["==","$type","Point"]
  },
];