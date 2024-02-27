var mapstyle_layers = [
  {
    id: "osmcarto",
    type: "raster",
    source: "osmcarto",
  },
  {
    id: "tigerReview",
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
    source: "tiger",
    "source-layer": "highways",
  },
  {
    id: "streetaddress",
    type: "line",
    paint: {
      "line-color": "#FF00FF",
    },
    "layout": {
      "line-cap": "round",
      "line-join": "round",
      "visibility": "none"
    },
    source: "streetaddress",
    "source-layer": "streetaddress",
  },
  {
    id: "redlined",
    type: "line",
    paint: {
      "line-color": "#FF0000",
    },
    "layout": {
      "line-cap": "round",
      "line-join": "round",
      "visibility": "none"
    },
    source: "redlined",
    "source-layer": "redlined-D",
  }
];
