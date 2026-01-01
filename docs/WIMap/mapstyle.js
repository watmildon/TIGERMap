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
    source: "WIMap",
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
    source: "WIMap",
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