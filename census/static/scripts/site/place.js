define(['jquery', 'bootstrap', 'chroma'], function($, bootstrap, chroma) {

    var colorSteps = ['#ff0000', '#edcf3b', '#7ab800'],
        colorScale = chroma.scale(colorSteps).domain([0, 100]),
        $placeOpeness = $('.place-openness'),
        $datasetOpeness = $('.dataset-openness'),
        naString = 'n/a',
        score;

    function initializePlace() {

        $.each($placeOpeness, function(index, el) {
            var $el = $(el);
            if ($el.data('score') === naString) {
                score = 0;
            } else {
                score = parseInt($el.data('score'), 10);
            }
            $el.css({
              'background-color': colorScale(score).hex(),
              'color': 'white'
            });
        });

        $.each($datasetOpeness, function(index, el) {
            var $el = $(el);
            if ($el.data('score') === naString) {
                score = 0;
            } else {
                score = parseInt($el.data('score'), 10);
            }
            $el.css({
              'background-color': colorScale(score).hex(),
              'color': 'white'
            });
        });

    }

    return {
        init: initializePlace,
    };

});
