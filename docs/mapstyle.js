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
    id: "tigerReview-rail",
    type: "line",
    paint: {
      "line-color": "#eb7734",
      "line-width": 2,
    },
    "layout": {
      "line-cap": "round",
      "line-join": "round",
      "visibility": "none"
    },
    source: "tiger",
    "source-layer": "highways",
    "filter": ["all", ["==", "railway", "rail"]]
  },
  {
    id: "tigerReview-pipeline",
    type: "line",
    paint: {
      "line-color": "#0000FF",
      "line-width": 2,
    },
    "layout": {
      "line-cap": "round",
      "line-join": "round",
      "visibility": "none"
    },
    source: "tiger",
    "source-layer": "highways",
    "filter": ["all", ["==", "man_made", "pipeline"]]
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