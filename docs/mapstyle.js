var mapstyle_layers = [
  {
    id: "osmcarto",
    type: "raster",
    source: "osmcarto",
  },
  {
    id: "highway",
    type: "line",
    paint: {
      "line-color": "#000000",
    },
    "layout": {
      "line-cap": "round",
      "line-join": "round",
      "visibility": "visible"
    },
    source: "tiger",
    "source-layer": "highways",
  }
];
