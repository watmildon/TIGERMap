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
  // Not plugin verdicts: alignment_verified roads that also carry a name or
  // directional suggestion (see ROAR_CATEGORY). Drawn orange with the
  // suggestion colour dashed on top.
  { verdict: "alignment_suggestion", label: "Alignment + name suggestion", color: "#ff7f00", dash: "#984ea3",
    description: "Mappers have edited the geometry, and nearby addresses or the National Address Database " +
                 "suggest a different name. Check the name against the suggestion." },
  { verdict: "alignment_directional", label: "Alignment + directional", color: "#ff7f00", dash: "#e7298a",
    description: "Mappers have edited the geometry, and nearby addresses or the National Address Database " +
                 "suggest the same name with a direction (N, S, E, W) added or changed." },
  { verdict: "unnamed_verified", label: "Unnamed verified", color: "#a65628",
    description: "An unnamed road whose geometry mappers have edited. " +
                 "With no name to check, the tiger:reviewed tag can be removed." },
  { verdict: "suggestion_only", label: "Name suggestion", color: "#984ea3",
    description: "Not verified yet, but nearby addresses or the National Address Database " +
                 "suggest a different name." },
  // Not a plugin verdict: suggestion_only roads whose suggestion only adds or
  // changes a direction.
  { verdict: "directional_suggestion", label: "Directional suggestion", color: "#e7298a",
    description: "Not verified yet, but nearby addresses or the National Address Database " +
                 "suggest the same name with a direction (N, S, E, W) added or changed." },
  { verdict: "invalid_value", label: "Invalid value", color: "#e41a1c",
    description: "tiger:reviewed has a value the plugin doesn't recognise " +
                 "(it expects no, name, aerial, position, alignment or yes). Someone needs to pick the right one.",
    info: { url: "https://taginfo.openstreetmap.org/keys/tiger%3Areviewed#values",
            title: "tiger:reviewed values on taginfo" } },
];

// Legend category of a roar feature: its verdict, split by roar:suggestion_kind
// for the two verdicts that carry suggestions (alignment_verified and
// suggestion_only; verdict_suggestions in us-roar-counts.json). Keep in step
// with roarCategory() and roarCategoryTotals() in main.js.
const ROAR_VERDICT = ["get", "roar:verdict"];
const ROAR_KIND = ["get", "roar:suggestion_kind"];
const ROAR_CATEGORY = [
  "case",
  ["all", ["==", ROAR_VERDICT, "alignment_verified"], ["==", ROAR_KIND, "directional"]], "alignment_directional",
  ["all", ["==", ROAR_VERDICT, "alignment_verified"], ["has", "roar:suggestion_kind"]], "alignment_suggestion",
  ["all", ["==", ROAR_VERDICT, "suggestion_only"], ["==", ROAR_KIND, "directional"]], "directional_suggestion",
  ROAR_VERDICT,
];
const ROAR_DASHED = ROAR_VERDICTS.filter(v => v.dash);
const ROAR_DASH_FILTER = ["in", ROAR_CATEGORY, ["literal", ROAR_DASHED.map(v => v.verdict)]];

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
    // NAD+ address points; the tiles start at zoom 10, complete at 14
    id: "NAD",
    type: "circle",
    paint: {
      "circle-color": "#0000FF",
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 1.5, 14, 3, 18, 6],
    },
    "layout": {
      "visibility": "none"
    },
    source: "NAD",
    "source-layer": "addresses",
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
    // TIGER ROAR verdicts (us-roar.pmtiles), coloured by legend category
    id: "roar",
    type: "line",
    paint: {
      "line-color": [
        "match", ROAR_CATEGORY,
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
    // Second colour for mixed categories, dashed over the roar line.
    // Shown, hidden and filtered together with "roar" (main.js).
    id: "roar-dash",
    type: "line",
    filter: ROAR_DASH_FILTER,
    paint: {
      "line-color": [
        "match", ROAR_CATEGORY,
        ...ROAR_DASHED.flatMap(v => [v.verdict, v.dash]),
        "#999999"
      ],
      "line-width": 3,
      "line-dasharray": [2, 2],
    },
    "layout": {
      "line-cap": "butt",
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
    // Clicked point features (e.g. NAD+ addresses); the line layer above skips points
    id: "highlight-point",
    type: "circle",
    filter: ["==", ["geometry-type"], "Point"],
    paint: {
      "circle-color": "#f5812f",
      "circle-radius": 7,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 1,
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