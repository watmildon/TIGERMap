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
    "filter": ["all", ["==", "tiger:reviewed", "no"]]
  },
  {
    id: "tigerReview-rail",
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
    "filter": ["all", ["==", "railway", "rail"], ["==","tiger:reviewed","no"]]
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
    "filter": ["all", ["==", "man_made", "pipeline"], ["==","tiger:reviewed","no"]]
  },
  {
    id: "tigerReview-power",
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
    "filter": ["all", ["has","power"], ["==","tiger:reviewed","no"]]
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
    id: "streetaddress-node",
    type: "circle",
    paint: {
      "circle-color": "#FF00FF",
      "circle-radius":2,
    },
    "layout": {
      "visibility": "none"
    },
    source: "streetaddress",
    "source-layer": "streetaddress",
    filter: ["==","$type","Point"]
  },
  {
    id: "NAD",
    type: "circle",
    paint: {
      "circle-color": "#0000FF",
    },
    "layout": {
      "visibility": "none"
    },
    source: "NAD",
    "source-layer": "NAD",
  },
  {
    id: "counties",
    type: "line",
    paint: {
      "line-color": "#4b0082",
      "line-width": 2,
    },
    "layout": {
      "line-cap": "round",
      "line-join": "round",
      "visibility": "none"
    },
    source: "counties",
    "source-layer": "counties",
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