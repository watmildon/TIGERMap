// TIGER ROAR verdicts: paint colour on the roar layer and the legend rows.
// `description` is the legend row's hovercard; it follows the plugin's rules
// (TIGER-ROAR TIGERReviewAnalyzer and the layer's FeatureProps).
const ROAR_VERDICTS = [
  { verdict: "fully_verified", label: "Fully verified", color: "#1a9850",
    description: "Both the name and the geometry have been confirmed by mappers. " +
                 "The tiger:reviewed tag can be removed." },
  { verdict: "name_verified", label: "Name verified", color: "#1f78b4",
    description: "Connected roads, nearby addresses, the National Address Database or other evidence agree on the name. " +
                 "The geometry still needs a check, so this can be tiger:reviewed=name." },
  { verdict: "alignment_verified", label: "Alignment verified", color: "#ff7f00",
    description: "Mappers, not just import bots, have edited the geometry, but nothing confirms the name. " +
                 "The name still needs a check." },
  { verdict: "unnamed_verified", label: "Unnamed verified", color: "#a65628",
    description: "An unnamed road whose geometry mappers have edited. " +
                 "With no name to check, the tiger:reviewed tag can be removed." },
  { verdict: "suggestion_only", label: "Name suggestion", color: "#984ea3",
    description: "Not verified yet, but nearby addresses or the National Address Database " +
                 "suggest a different name or a missing direction (N, S, E, W)." },
  { verdict: "invalid_value", label: "Invalid value", color: "#e41a1c",
    description: "tiger:reviewed has a value the plugin doesn't recognise " +
                 "(it expects no, name, aerial, position, alignment or yes). Someone needs to pick the right one.",
    info: { url: "https://taginfo.openstreetmap.org/keys/tiger%3Areviewed#values",
            title: "tiger:reviewed values on taginfo" } },
];

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
    "filter": ["all", ["==", ["get", "tiger:reviewed"], "no"]]
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
    "filter": ["all", ["==", ["get", "railway"], "rail"], ["==", ["get", "tiger:reviewed"], "no"]]
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
    "filter": ["all", ["==", ["get", "man_made"], "pipeline"], ["==", ["get", "tiger:reviewed"], "no"]]
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
    "filter": ["all", ["has", "power"], ["==", ["get", "tiger:reviewed"], "no"]]
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
    "source-layer": "allFeatures",
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
  },
  {
    // TIGER ROAR verdicts (us-roar.pmtiles), coloured by roar:verdict
    id: "roar",
    type: "line",
    paint: {
      "line-color": [
        "match", ["get", "roar:verdict"],
        ...ROAR_VERDICTS.flatMap(v => [v.verdict, v.color]),
        "#999999"
      ],
      "line-width": 3,
    },
    "layout": {
      "line-cap": "round",
      "line-join": "round",
      "visibility": "none"
    },
    source: "roar",
    "source-layer": "roar",
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