var main = {
    mapPlaceObject: function (object) {
        var place = {};
        if (checkIfValidObject(object)) {
            place.id = object.id || false;
            place.name = object.name;
            place.region = object.region;
            place.continent = object.continent;
            place.slug = object.slug;
            place.site = object.site;

            if (!place.id) {
                return false;
            } else {
                return place;
            }

        } else {
            return false;
        }

    },
    mapDatasetsObject: function (object) {
        var dataset = {};

        return dataset;
    },
    mapQuestionObject: function (object) {
        var question = {};

        return question;
    }
};

function checkIfValidObject(object) {

    if (object && Object.keys(object) && Object.keys(object).length) {
        return true;
    } else {
        return false;
    }
}

module.exports = main;

