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
    source: "UTMap",
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
    source: "UTMap",
    "source-layer": "allFeatures",
    filter: ["==","$type","Point"]
  },
  {
    id: "gnisMissing",
    type: "line",
    paint: {
      "line-color": "#FF00FF",
      "line-width": 2,
    },
    "layout": {
      "line-cap": "round",
      "line-join": "round",
      "visibility": "none"
    },
    source: "gnisMissing",
    "source-layer": "allFeatures",
  },
  {
    id: "gnisMissing-node",
    type: "circle",
    paint: {
      "circle-color": "#FF00FF",
      "circle-radius":4,
    },
    "layout": {
      "visibility": "none"
    },
    source: "gnisMissing",
    "source-layer": "allFeatures",
    filter: ["==","$type","Point"]
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
  }
];