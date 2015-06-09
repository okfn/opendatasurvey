var main = {
//    \id: 'emissions',
//    title: 'Pollutant Emissions',
//    category: 'Environment',
//    description:
    mapPlaceObject: function (object) {
        var place = {};
        if (checkIfValidObject(object)) {
            place.id = object.id || false;
            place.name = object.name;
            place.region = object.region;
            place.continent = object.continent;
            place.slug = object.slug;
            place.site = object.site;

            return checkIfHasId(place);

        } else {
            return false;
        }

    },
    mapDatasetsObject: function (object) {
        var dataset = {};

        if (checkIfValidObject(object)) {
            dataset.id = object.id || false;
            dataset.name = object.title;
            dataset.category = object.category;
            dataset.description = object.description;
            dataset.icon = object.icon;
            dataset.site = object.site;

            return checkIfHasId(dataset);

        } else {
            return false;
        }

        return dataset;
    },
    mapQuestionObject: function (object) {
        var question = {};

        if (checkIfValidObject(object)) {
            question.id = object.id || false;
            question.site = object.site;
            question.question = object.question;
            question.description = object.description;
            question.type = object.type;
            question.placeholder = object.placeholder;
            question.score = parseInt(object.score) || 0;
            question.icon = object.icon;
            question.dependants = splitDependants(object.dependants) || [];

            return checkIfHasId(question);

        } else {
            return false;
        }

        return question;
    }
};

function splitDependants(dependants) {
    var split = false;
    if (dependants && dependants.length) {
        split = dependants.split(',');
    }
    return split;
}

function checkIfValidObject(object) {

    if (object && Object.keys(object) && Object.keys(object).length) {
        return true;
    } else {
        return false;
    }
}

function checkIfHasId(object) {
    if (!object.id) {
        return false;
    } else {
        return object;
    }
}

module.exports = main;

