var mainDataMapper = require('../dataMapper/main');

var entitiesConstructor = {
    mapPlaces: function (places) {
        var mappedObject = [];
        if (places && places.length) {
            var length = places.length;
            for (var i = 0; i < length; i++) {
                var currentObject = places[i];
                var mappedCurrentObject = mainDataMapper.mapPlaceObject(currentObject);
                if (mappedCurrentObject) {
                    mappedObject.push(mappedCurrentObject);
                }
            }

            return mappedObject;
        } else {
            return false;
        }
    },
    mapDatasets: function (datasets) {
        var mappedObject = [];
        if (datasets && datasets.length) {
            var length = datasets.length;
            for (var i = 0; i < length; i++) {
                var currentObject = datasets[i];
                var mappedCurrentObject = mainDataMapper.mapDatasetsObject(currentObject);
                if (mappedCurrentObject) {
                    mappedObject.push(mappedCurrentObject);
                }
            }

            return mappedObject;
        } else {
            return false;
        }
    },
    mapQuestions: function (questions) {
        var mappedObject = [];
        if (questions && questions.length) {
            var length = questions.length;
            for (var i = 0; i < length; i++) {
                var currentObject = questions[i];
                var mappedCurrentObject = mainDataMapper.mapQuestionObject(currentObject);
                if (mappedCurrentObject) {
                    mappedObject.push(mappedCurrentObject);
                }
            }

            return mappedObject;
        } else {
            return false;
        }
    },
    mapRegistry: function mapRegistry(registryObjects) {
        var mappedObject = [];
        if (registryObjects && registryObjects.length) {
            var length = registryObjects.length;
            for (var i = 0; i < length; i++) {
                var currentObject = registryObjects[i];
                var mappedCurrentObject = mainDataMapper.mapRegistryObject(currentObject);
                if (mappedCurrentObject) {
                    mappedObject.push(mappedCurrentObject);
                }
            }
            return mappedObject;
        } else {
            return false;
        }
    },
    setSiteValue: function (entitiesArray, site) {
        for (var i = 0; i < entitiesArray.length; i++) {
            entitiesArray[i]['site'] = site;
        }

        return entitiesArray;
    }
};

module.exports = entitiesConstructor;
