define(['table', 'place', 'ui', 'domReady', 'censusForm', 'dotDotDot', 'appList'], function(table, place, ui, domReady, censusForm, dotDotDot, appList) {
    domReady(function() {
        place.init();
        table.init();
        ui.init();
    });
});
