define(['data', 'ui', 'domReady'], function(data, ui, domReady) {
    domReady(function() {
        data.init();
        ui.init();
    });
});
