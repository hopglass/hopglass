require.config({
  baseUrl: "lib",
  paths: {
    "leaflet": "../node_modules/leaflet/dist/leaflet",
    "leaflet.label": "../node_modules/leaflet-label/dist/leaflet.label",
    "leaflet.providers": "../node_modules/leaflet-providers/leaflet-providers",
    "chroma-js": "../node_modules/chroma-js/chroma-light.min",
    "moment": "../node_modules/moment/min/moment-with-locales.min",
    "tablesort": "../node_modules/tablesort/tablesort.min",
    "tablesort.numeric": "../node_modules/tablesort/src/sorts/tablesort.numeric",
    "d3": "../node_modules/d3/d3.min",
    "numeral": "../node_modules/numeraljs/min/numeral.min",
    "numeral-intl": "../node_modules/numeraljs/min/languages.min",
    "virtual-dom": "../node_modules/virtual-dom/dist/virtual-dom",
    "rbush": "../node_modules/rbush/rbush",
    "helper": "../helper",
    "jshashes": "../node_modules/jshashes/hashes"
  },
  shim: {
    "leaflet.label": ["leaflet"],
    "leaflet.providers": ["leaflet"],
    "tablesort": {
      exports: "Tablesort"
    },
    "numeral-intl": {
      deps: ["numeral"],
      exports: "numeral"
    },
    "tablesort.numeric": ["tablesort"],
    "helper": ["numeral-intl"]
  }
})

require(["main", "helper"], function (main) {
  getJSON("config.json").then(main)
})
