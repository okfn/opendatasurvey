define(['leaflet', 'proj4', 'proj4leaflet', 'leaflet_zoommin', 'leaflet_label', 'jquery', 'pubsub',
        'lodash', 'chroma', 'marked', 'data'],
       function(leaflet, proj4, proj4leaflet, leaflet_zoommin, leaflet_label, $, pubsub, _, chroma,
                marked, data) {

           proj4.defs("EPSG:3410", "+proj=cea +lon_0=0 +lat_ts=30 +x_0=0 +y_0=0 +a=6371228 +b=6371228 +units=m +no_defs");

           var $container = $('.odi-vis.odi-vis-choropleth'),
        $tools = $('.odi-vis-tools'),
        $miniLegend = $('.odi-vis-legend ul'),
        $fullLegend = $('.odi-vis-legend-full ul'),
        $fullLegendTrigger = $('.odi-vis-show-legend-full'),
        $fullLegendBox = $('.odi-vis-legend-full'),
        $display = $('.odi-vis-display'),
        $infoTrigger = $('.odi-vis-show-info'),
        $infoBox = $('.odi-vis-info'),
        $placeBox = $('.odi-vis-place'),
        $titleBox = $('.odi-vis-title'),
        $datasetFilter = $tools.find('.odi-filter-dataset').first(),
        $yearFilter = $tools.find('.odi-filter-year').first(),
        $helpPanel = $('.odi-vis-help'),
        $toolsPanel = $('.odi-vis-tools'),
        topics = {
            init: 'init',
            tool_change: 'tool.change',
            state_change: 'state.change'
        },
        trueStrings = ['true', 'yes'],
        falseStrings = ['false', 'no'],
        colorDark = '#2d2d2d',
        colorSteps = ['#ff0000', '#edcf3b', '#7ab800'],
        colorScale = chroma.scale(colorSteps).domain([0, 100]),
        mapLatLongBase = [30, 5],
        mapZoomBase = 1,
        res = [90000, 30000, 20000, 10000, 5000, 2500, 1250, 600, 300, 100, 80, 40],
        RD2 = new L.Proj.CRS.TMS(
                   'EPSG:3410',
                   "+proj=cea +lon_0=0 +lat_ts=30 +x_0=0 +y_0=0 +a=6371228 +b=6371228 +units=m +no_defs", [-28, 225, 595, 903],
                   {
                       resolutions: res
                    }
        ),
        mapInitObj = {
            zoomControl: false,
            zoomAnimation: false,
            attributionControl: false,
            minZoom: 1,
            maxZoom: 9,
            crs: RD2
        },
        map = leaflet.map('map', mapInitObj),
        geoLayer = setGeoLayer(),
        geoLayerLookup = {},
        placeStyleBase = {
            weight: 1,
            opacity: 1,
            color: colorDark,
            dashArray: '2',
            fillOpacity: 1
        },
        placeStyleFocus = {
            weight: 1.5,
            color: colorDark,
            dashArray: '',
        },
        fullLegendCloseClass = 'odi-vis-legend-full-close',
        placeControl = leaflet.control(),
        placeBoxClass = 'odi-vis-place',
        placeBoxCloseClass = 'odi-vis-place-close',
        placeBoxTmpl = _.template($('script.place-box').html()),
        placeToolTipTmpl = _.template($('script.place-tooltip').html()),
        infoBoxCloseClass = 'odi-vis-info-close',
        infoBoxTmpl = _.template($('script.info-box').html()),
        yearOptionsTmpl = _.template($('script.year-options').html()),
        datasetOptionsTmpl = _.template($('script.dataset-options').html()),
        titleBoxTmpl = _.template($('script.title-box').html()),
        dataStore = {
            meta: undefined,
            summary: undefined,
            places: undefined,
            datasets: undefined,
            entries: undefined,
            geo: undefined
        },
        queryString = window.location.search,
        uiStateDefaults = {
            embed: {
                width: '100%',
                height: '100%',
                title: sitename,
                sponsor: sponsor,
                sitename: sitename
            },
            filter: {
                year: currentYear,
                dataset: 'all'
            },
            panel: {
                name: true,
                tools: true,
                help: true,
                legend: true
            },
            map: {
                place: undefined
            },
            asQueryString: undefined
        },
        uiState = setUIState(topics.init, getUIStateArgs());

    map.on('zoomend', function(e){
        // if (e.target._zoom == mapZoomBase) {
        //     map.setView(mapLatLongBase, mapZoomBase);
        //     map.dragging.disable();
        // } else {
            map.dragging.enable();
        // }
    });

    $('body').on('click', '.odi-vis-nav-zoom-in', function () {
        map.zoomIn();
        return false;
    });

    $('body').on('click', '.odi-vis-nav-zoom-out', function () {
        map.zoomOut();
        return false;
    });

    $('body').on('click', '.odi-vis-nav-zoom-min', function () {
        map.setZoom(1);
        return false;
    });

    $(".leaflet-control-container").css("visibility", "hidden");

    pubsub.subscribe(data.topics.meta, metaHandler);
    pubsub.subscribe(data.topics.summary, summaryHandler);
    pubsub.subscribe(data.topics.places, placesHandler);
    pubsub.subscribe(data.topics.datasets, datasetsHandler);
    pubsub.subscribe(data.topics.entries, entriesHandler);
    pubsub.subscribe(topics.tool_change, updateUIState);
    pubsub.subscribe(topics.state_change, redrawDisplay);
    pubsub.subscribe(topics.state_change, pushStateToURL);
    pubsub.subscribe(topics.init, setDimensions);
    pubsub.subscribe(topics.init, setPanels);
    pubsub.subscribe(topics.state_change, setPanels);
    pubsub.subscribe(topics.geolayer_ready, setMapView);

    function rankLookup(year) {
        if (year === dataStore.meta.currentYear) {
            return 'rank';
        } else {
            return 'rank_YEAR'.replace('YEAR', year);
        }
    }

    function rankPrevious(year) {
        return  'rank_YEAR'.replace('YEAR', dataStore.meta.previousYear);
    }

    function scoreLookup(year) {
        if (year === dataStore.meta.currentYear) {
            return 'score';
        } else {
            return 'score_YEAR'.replace('YEAR', year);
        }
    }

    function scorePrevious(year) {
        return  'score_YEAR'.replace('YEAR', dataStore.meta.previousYear);
    }

    function metaHandler(topic, data) {
        var context = {};
        dataStore.meta = data;
        _.each(data.years, function(value) {
            context.year = value;
            if (uiState.filter.year === value) {
                context.selected = 'selected';
            } else {
                context.selected = '';
            }
            $yearFilter.append(yearOptionsTmpl(context));
        });
    }

    function summaryHandler(topic, data) {
        // console.log('summary data is ready');
    }

    function placesHandler(topic, data) {
        dataStore.places = data.places;
        dataStore.geo = data.geo;
        dataStore.entries = data.entries;
        geoHandler(data.geo);
    }

    function geoHandler(data) {
        addGeoDataToLayer(data);
    }

    function datasetsHandler(topic, data) {
        var context = {},
            ext_context = {};

        dataStore.datasets = data;
        _.each(data, function(value) {
            context.dataset_id = value.id;
            context.dataset = value.title;
            if (uiState.filter.dataset === value.id) {
                context.selected = 'selected';
            } else {
                context.selected = '';
            }
            $datasetFilter.append(datasetOptionsTmpl(context));
        });

        ext_context.dataset_id = 'improvement';
        ext_context.dataset = '* Most Improved';
        ext_context.selected = '';
        $datasetFilter.append(datasetOptionsTmpl(ext_context));
    }

    function entriesHandler(topic, data) {
        dataStore.entries = data;
    }

    function setGeoLayer() {
        var geoLayerOptions = {
            style: setPlaceColors,
            onEachFeature: onEachPlace
        };

        return leaflet.geoJson(undefined, geoLayerOptions).addTo(map);
    }

    function addGeoDataToLayer(geoData) {
        geoLayer.addData(geoData);
        geoLayer.eachLayer(function(layer){
            geoLayerLookup[layer.feature.properties.iso_a2.toLowerCase()] = layer;
        });
        pubsub.publish(topics.geolayer_ready, geoLayer);
    }

    function setMapView(topic, data) {
        if (uiState.map.place !== 'undefined' &&
            geoLayerLookup.hasOwnProperty(uiState.map.place)) {
            // we want to init the map focused on a place
            map.fitBounds(geoLayerLookup[uiState.map.place].getBounds());
        } else {
            // we want the full view of the map
            map.setView(mapLatLongBase, mapZoomBase);
        }
    }

    function setDimensions(topic, data) {
        $container.css('width', data.embed.width);
        $container.css('height', data.embed.height);
    }

    function setPanels(topic, data) {
        if (!data.panel.tools) {
            $toolsPanel.hide();
            $('.leaflet-container').css('background-color', '#8bbee1');
        } else {
            $titleBox.hide();
        }
        if (!data.panel.help) {
            $helpPanel.hide();
        }
    }

    function pushStateToURL(topic, data) {
        history.pushState({}, '', data.asQueryString);
    }

    function getStateQueryString(state) {
        var qargs = [];
        _.forOwn(state, function(value, key) {
            if (key !== 'asQueryString') {
                // key namespace
                ns = 'K_'.replace('K', key);
                _.forOwn(value, function(nv, nk) {
                    // ONLY add params for non-default values
                    if (nv !== uiStateDefaults[key][nk]) {
                        // param key
                        pk = encodeURIComponent('NS_K'.replace('NS_', ns).replace('K', nk));
                        pv = encodeURIComponent(nv);
                        param = 'K=V'.replace('K', pk).replace('V', pv);
                        qargs.push(param);
                    }
                });
            }
        });
        if(qargs.length > 0){
            qs = '?QARGS'.replace('QARGS', qargs.join('&'));
        } else {
           qs = '';
        }
        return qs;
    }

    function setUIState(topic, data) {
        var rv = _.cloneDeep(uiStateDefaults);

        _.forOwn(data, function(value, key) {
            _.assign(rv[key], value);
        });
        rv.asQueryString = getStateQueryString(rv);
        return rv;
    }

    function updateUIState(topic, data) {
        uiState = setUIState(topic, getUIStateArgs(data));
        pubsub.publish(topics.state_change, uiState);
    }

    /**
     * Bootstraps the UI state from passed args.
     * Args come from query params, but if `data` is passed,
     * it overrides query params (and updates them).
     */
    function getUIStateArgs(data) {
        var cleanedQuery = queryString
                        .replace(/\?/g, '')
                        .replace(/\//g, '')
                        .split("&"),
            allowedArgs = [
                'embed_width',
                'embed_height',
                'embed_title',
                'filter_year',
                'filter_dataset',
                'panel_name',
                'panel_tools',
                'panel_help',
                'panel_legend',
                'map_place'
            ],
            passedState = {
                embed: {},
                filter: {},
                panel: {},
                map: {}
            };

        if (typeof(data) !== 'undefined') {
            return data;
        } else {
            _.each(cleanedQuery, function(value) {
                // get key/value from string
                kv = value.split('=');
                if (_.contains(allowedArgs, kv[0])) {
                    // get namespace args from key
                    ns = kv[0].split('_');
                    // force true/false strings to boolean values
                    if (_.contains(trueStrings, kv[1].toLowerCase())) {
                        kv[1] = true;
                    } else if (_.contains(falseStrings, kv[1].toLowerCase())) {
                        kv[1] = false;
                    }
                    passedState[ns[0]][ns[1]] = kv[1];
                }
            });
            return passedState;
        }
    }

    function setPlaceColors(feature) {
        var fillColor = colorScale(NaN).hex(), //this is grey color
        score = 0,
        match;

        if (uiState.filter.dataset === 'all' ||
            typeof(uiState.filter.dataset) === 'undefined') {
            // get calculated total scores from the place data
            match = _.find(dataStore.places, {'id': feature.properties.iso_a2.toLowerCase()});
            if (match) {
                score = parseInt(match[scoreLookup(uiState.filter.year)], 10);
                if (score) {
                    fillColor = colorScale(score).hex();
                }
            }
        } else if (uiState.filter.dataset === 'improvement') {
            match = _.find(dataStore.places, {'id': feature.properties.iso_a2.toLowerCase()});
            if (match) {
                score = parseInt(match.improvement_scaled, 10);
                if (score) {
                    fillColor = colorScale(score).hex();
                }
            }
        } else {
            // calculate for this dataset/year/place from entries data
            match = _.find(dataStore.entries, {
                'place': feature.properties.iso_a2.toLowerCase(),
                'year': uiState.filter.year,
                'dataset': uiState.filter.dataset
            });
            if (match) {
                score = parseInt(match.score, 10);
                if (score) {
                    fillColor = colorScale(score).hex();
                }
            }
        }
        rv = _.clone(placeStyleBase);
        rv.fillColor = fillColor;
        return rv;
    }

    function placeHoverHandler(event) {
        var layer = event.target;
        layer.setStyle(placeStyleFocus);
        if (!leaflet.Browser.ie && !leaflet.Browser.opera) {
            layer.bringToFront();
        }
    }

    function placeExitHandler(event) {
        geoLayer.resetStyle(event.target);
    }

    function placeClickHandler(event) {
        map.fitBounds(event.target.getBounds());
        setPlaceBox(event.target.feature.properties);
    }

    function onEachPlace(feature, layer) {
        var place;
        if (feature && feature.properties && feature.properties.iso_a2) {
            place = _.find(dataStore.places, {'id': feature.properties.iso_a2.toLowerCase()});
            if (place) {
                var tooltip = getPlaceToolTip(place);
                if (tooltip) {
                    layer.bindLabel(tooltip).addTo(map);
                }
            }
        }

        layer.on({
            mouseover: placeHoverHandler,
            mouseout: placeExitHandler,
            click: placeClickHandler
        });
    }

    function redrawDisplay(topic, data) {
        addGeoDataToLayer(dataStore.geo);
        $placeBox.empty();
        $placeBox.hide();
        $infoBox.empty();
        $infoBox.hide();
    }

    /**
     * Bootstraps listeners for the info panel
     */
     function initMetaInfo() {
        var $this,
            context = {},
            activeInfo = '_activeinfo';

        // box is rendered on demand in a lodash tmpl, so, listen on body
        $('body').on('click', '.'+infoBoxCloseClass, function () {
            $infoBox.empty();
            $infoBox.hide();
        });

        // box is rendered on demand in a lodash tmpl, so, listen on body
        $('body').on('click', '.'+placeBoxCloseClass, function () {
            $placeBox.empty();
            $placeBox.hide();
        });

        $('body').on('click', '.'+fullLegendCloseClass, function () {
            $fullLegendBox.hide();
        });

        $fullLegendTrigger.on('click', function() {
            $fullLegendBox.toggle();
        });

        $infoTrigger.on('click', function() {
            $this = $(this);
            if ($this.hasClass(activeInfo)) {
                $this.removeClass(activeInfo);
                $infoBox.empty();
                $infoBox.hide();
            } else {
                // we want to always enforce certain
                // state conditions on embeds, so...
                var embedState = _.cloneDeep(uiState);
                embedState.panel.tools = false;
                context.state_params = getStateQueryString(embedState);

                $this.siblings().removeClass(activeInfo);
                $this.addClass(activeInfo);
                $infoBox.html(infoBoxTmpl(context));
                $infoBox.show();
            }
        });
        $titleBox.html(titleBoxTmpl({'title': decodeURIComponent(uiState.embed.title.replace(/;/g, '/')), 'sitename': uiState.embed.sitename}));
     }

    /**
     * Bootstraps visualisation tools
     */
    function initMetaTools() {
        var $this;

        $datasetFilter.on('change', function() {
            $this = $(this);
            uiState.filter.dataset = $this.val();
            uiState.filter.year = $yearFilter.val();

            if ($this.val() === 'improvement') {
                $yearFilter.val(currentYear);
                $yearFilter.attr('disabled', true);
            } else {
                $yearFilter.removeAttr('disabled');
            }

            pubsub.publish(topics.tool_change, uiState);
        });

        $yearFilter.on('change', function() {
            $this = $(this);
            uiState.filter.year = $this.val();
            uiState.filter.dataset = $datasetFilter.val();
            pubsub.publish(topics.tool_change, uiState);
        });
    }

    /**
     * Bootstraps visualisation legend
     */
    function initMetaLegend() {
        var $this,
            score;

        _.each($miniLegend.find('li'), function(value) {
            $this = $(value);
            score = parseInt($this.data('score'), 10);
            $this.css('background-color', colorScale(score).hex());
        });

        _.each($fullLegendBox.find('.odi-vis-info-text i'), function(value) {
            $this = $(value);
            score = parseInt($this.data('score'), 10);
            $this.css('background-color', colorScale(score).hex());
        });
    }

    /**
     * Bootstraps the visualisation meta section
     */
    function initMeta() {
        initMetaTools();
        initMetaLegend();
        initMetaInfo();
    }


    function getPlaceToolTip(place) {
        var context = {},
            place,
            match,
            score,
            rank;

        function makeTitle() {
            var title = place.name;

            if (uiState.filter.dataset !== 'all' ||
                typeof(uiState.filter.dataset) !== 'undefined') {
                title = title + ' ' + uiState.filter.dataset;
            }

            if (typeof(uiState.filter.year) !== 'undefined') {
                title = title + ' ' + uiState.filter.year;
            }
            return title;
        }

        if (typeof(place) !== 'undefined') {

            if (uiState.filter.dataset === 'all' ||
                typeof(uiState.filter.dataset) === 'undefined') {
                // get calculated total scores from the place data
                if (place) {
                    score = place[scoreLookup(uiState.filter.year)];
                    rank = place[rankLookup(uiState.filter.year)];
                    if (uiState.filter.year === dataStore.meta.currentYear) {
                        previousScore = parseInt(place[scorePrevious(uiState.filter.year)], 10);
                    }
                }
            } else if (uiState.filter.dataset === 'improvement') {
                if (place) {
                    score = place.improvement;
                }
            } else {
                // calculate for this dataset/year/place from entries data
                match = _.find(dataStore.entries, {
                    'place': place.id,
                    'year': uiState.filter.year,
                    'dataset': uiState.filter.dataset
                });
                if (match) {
                    score = match.score;
                    rank = match.rank;
                }
            }

            score = (score)? parseInt(score, 10) : 0;
            rank = (rank)? parseInt(rank, 10) : 0;

                context.title = makeTitle();
                context.place = place.name;
                context.score = score;
                context.rank = rank;
        }
        if (score && score != -100) {
            return placeToolTipTmpl(context);
        }
    }

    function setPlaceBox(properties) {
            var context = {},
                place,
                match,
                score,
                rank,
                previousScore;

        function makeTitle() {
            var title = place.name;

            if (uiState.filter.dataset !== 'all' ||
                typeof(uiState.filter.dataset) !== 'undefined') {
                title = title + ' ' + uiState.filter.dataset;
            }

            if (typeof(uiState.filter.year) !== 'undefined') {
                title = title + ' ' + uiState.filter.year;
            }
            return title;
        }

        if (properties) {

            if (uiState.filter.dataset === 'all' ||
                typeof(uiState.filter.dataset) === 'undefined') {
                // get calculated total scores from the place data
                place = _.find(dataStore.places, {'id': properties.iso_a2.toLowerCase()});
                if (place) {
                    score = place[scoreLookup(uiState.filter.year)];
                    rank = place[rankLookup(uiState.filter.year)];
                    if (uiState.filter.year === dataStore.meta.currentYear) {
                        previousScore = place[scorePrevious(uiState.filter.year)];
                    }
                }
            } else if (uiState.filter.dataset === 'improvement') {
            place = _.find(dataStore.places, {'id': properties.iso_a2.toLowerCase()});
                if (place) {
                    score = place.improvement;
                }
            } else {
                // calculate for this dataset/year/place from entries data
                match = _.find(dataStore.entries, {
                    'place': properties.iso_a2.toLowerCase(),
                    'year': uiState.filter.year,
                    'dataset': uiState.filter.dataset
                });
                previousMatch = _.find(dataStore.entries, {
                    'place': properties.iso_a2.toLowerCase(),
                    'year': (parseInt(uiState.filter.year, 10) - 1).toString(),
                    'dataset': uiState.filter.dataset
                });
                if (match) {
                    place = _.find(dataStore.places, {'id': match.place});
                    score = match.score;
                    rank = match.rank;
                    if (previousMatch) {
                        previousScore = previousMatch.score;
                    }
                }
            }

            score = (score)? parseInt(score, 10) : 0;
            previousScore = (previousScore)? parseInt(previousScore, 10) : 0;
            rank = (rank)? parseInt(rank, 10) : 0;


            context.year = uiState.filter.year;
            context.title = makeTitle();
            context.name = place.name;
            context.slug = place.slug;
            context.score = score;
            context.rank = rank;
            context.previous_score = previousScore;
            if (score) {
                $placeBox.html(placeBoxTmpl(context));
                $placeBox.show();
            }
        }
    }

    /**
     * Bootstraps the visualisation map
     */
    function initViewMap() {
        new L.Control.ZoomMin({ position: 'bottomright' }).addTo(map);
    }

    /**
     * Bootstraps the visualisation view section
     */
    function initView() {
        initViewMap();
    }

    /**
     * Boostraps the visualisation interface
     */
    function initUI() {
        pubsub.publish(topics.init, uiState);
        initMeta();
        initView();
    }

    return {
        init: initUI
    };
});
