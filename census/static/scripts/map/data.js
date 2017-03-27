define(['jquery', 'pubsub'], function($, pubsub) {
    var topics = {
            meta: 'data.meta',
            summary: 'data.summary',
            places: 'data.places',
            datasets: 'data.datasets',
            entries: 'data.entries',
            geo: 'data.geo',
            init_entries: 'init_entries',
            init_places: 'init_places'
        },
        api = {
            summary: 'SITEURL/api/summary.json'.replace('SITEURL', siteUrl),
            places: 'SITEURL/api/places.json'.replace('SITEURL', siteUrl),
            datasets: 'SITEURL/api/datasets.json'.replace('SITEURL', siteUrl),
            entries: 'SITEURL/api/entries.json'.replace('SITEURL', siteUrl),
            geo: 'SITEURL/data/geo.json'.replace('SITEURL', siteUrl)
        };

    pubsub.subscribe(topics.init_entries, getPlaceData);
    pubsub.subscribe(topics.init_places, getGeoData);

    /**
     * Gets meta data and publishes topic when ready
     */
    function getMetaData() {
        data = {
            currentYear: currentYear,
            previousYear: previousYear,
            years: years
        };
        pubsub.publish(topics.meta, data);
    }

    /**
     * Gets summary data and publishes topic when ready
     */
    function getSummaryData() {
        $.get(api.summary)
          .done(function(data) {
            pubsub.publish(topics.summary, data);
        });
    }

    /**
     * Gets place data and passes to `callback` for further processing
     */
    function getPlaceData(topic, entry_data) {

        var prev_score_lookup = 'score_'+previousYear;

        function setPlaceImprovement(place) {
            var previous,
                current;

            if (place.score === null && place[prev_score_lookup] === null) {
              return null;
            } else if (place[prev_score_lookup] === null && place.score) {
              return '100';
            } else {
              previous = parseInt(place[prev_score_lookup], 10);
              current = parseInt(place.score, 10);
              return ((current - previous)/previous)*100;
            }
        }

        function setPlaceImprovementScaled(place) {
            var previous,
                current;

            if (place.score === null && place[prev_score_lookup] === null) {
              return null;
            } else if (place[prev_score_lookup] === null && place.score) {
              return '100';
            } else {
              previous = parseInt(place[prev_score_lookup], 10);
              current = parseInt(place.score, 10);
              return ((((current - previous)/previous)*100) + 100)/2;
            }
        }

        $.get(api.places)
          .done(function(data) {
            d = {};
            _.each(data, function(value) {
              value.improvement = setPlaceImprovement(value);
              value.improvement_scaled = setPlaceImprovementScaled(value);
            });
            d.entries = entry_data;
            d.places = data;
            pubsub.publish(topics.init_places, d);
        });
    }

    /**
     * Gets geo data from the available places and publishes topic when ready
     */
    function getGeoData(topic, _data) {
        var d = {};
        $.get(api.geo)
          .done(function(data) {
            d.places = _data.places;
            d.entries = _data.entries;
            d.geo = data;
            pubsub.publish(topics.places, d);
        });
    }

    /**
     * Gets dataset data and publishes topic when ready
     */
    function getDatasetData() {
        $.get(api.datasets)
          .done(function(data) {
            pubsub.publish(topics.datasets, data);
        });
    }

    /**
     * Gets entry data and publishes topic when ready
     */
    function getEntryData() {
        $.get(api.entries)
          .done(function(data) {
            pubsub.publish(topics.init_entries, data);
        });
    }

    /**
     * Bootstraps the data required for the visualisation
     */
    function initData() {
        getMetaData();
        getDatasetData();
        getEntryData();
    }

    return {
        init: initData,
        topics: topics
    };
});



