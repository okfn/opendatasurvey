var main = {
    mapPlaceObject: function (object) {
        var place = {};
        place.id = object.id;
        place.name = object.name;
        place.region = object.region;
        place.continent = object.continent;
        place.description = object.slug;
        //TO DO: refactor this
        place.site = 'something';
        
        return place;
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

module.exports = main;