require.config({
  baseUrl: siteUrl,
  shim: {
    leaflet: {exports: 'L'},
    leaflet_zoommin: {deps: ['leaflet']},
    leaflet_label: {deps: ['leaflet']}
  },
  paths: {
    app: '/scripts/map/main',
    domReady: '/bower_components/domReady/domReady',
    leaflet: '/bower_components/leaflet/dist/leaflet',
    proj4: '/scripts/vendor/proj4',
    proj4leaflet: '/scripts/vendor/proj4leaflet',
    leaflet_zoommin: '/scripts/vendor/L.Control.ZoomMin',
    leaflet_label: '/bower_components/Leaflet.label/dist/leaflet.label',
    jquery: '/bower_components/jquery/dist/jquery.min',
    chroma: '/bower_components/chroma-js/chroma.min',
    pubsub: '/bower_components/pubsub-js/src/pubsub',
    lodash: '/bower_components/lodash/dist/lodash.compat.min',
    marked: '/bower_components/marked/marked.min',
    data: '/scripts/map/data',
    ui: '/scripts/map/ui'
  }
});

requirejs(['app']);
