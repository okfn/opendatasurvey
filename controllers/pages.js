'use strict';

var _ = require('underscore');
var marked = require('marked');


var overview = function (req, res) {

  var places = req.app.get('models').Place.findAll({
    where: {
      site: req.params.domain
    }
  });

  // TODO : sort places by score, for current year

  var datasets = req.app.get('models').Dataset.findAll({
    where: {
      site: req.params.domain
    }
  });

  // TODO dataset count
  var extraWidth = (null > 12);

  // TODO: model.data.entries.summary?
  var summary;

  // TODO: model.data.entries.byplace
  var byplace;

  // TODO: util.translateRows(model.data.scoredQuestions, req.locale)
  var questions;

  // TODO: util.translateObject(model.data.placesById, req.locale)
  var placesById;

  res.render('overview.html', {
    summary: summary,
    extraWidth: extraWidth,
    places: places, // TODO: translate
    byplace: byplace,
    datasets: datasets, // TODO: translate
    scoredQuestions: questions,
    placesById: placesById,
    custom_text: req.app.get('config').get('overview_page', req.locale),
    missing_place_html: req.app.get('config').get('missing_place_html', req.locale)
  });
};


var faq = function (req, res) {

  var qTmpl = req.app.get('view_env').getTemplate('_snippets/questions.html');
  var dTmpl = req.app.get('view_env').getTemplate('_snippets/datasets.html');
  var gettext = res.locals.gettext;

  // TODO: util.translateQuestions(model.data.questions, req.locale)
  var questions = req.app.get('models').Question.findAll({
    where: {
      site: req.params.domain
    }
  });

  // TODO: util.markupRows(util.translateRows(model.data.datasets, req.locale))
  var datasets = req.app.get('models').Dataset.findAll({
    where: {
      site: req.params.domain
    }
  })

  var qContent = qTmpl.render({gettext: gettext, questions: questions});
  var dContent = dTmpl.render({gettext: gettext, datasets: datasets});
  var mContent = req.app.get('config').get('missing_place_html', req.locale);

  var content = marked(req.app.get('config').get('faq_page', req.locale))
    .replace('{{questions}}', qContent)
    .replace('{{datasets}}', dContent)
    .replace('{{missing_place}}', mContent);

  res.render('base.html', {
    content: content,
    title: 'FAQ - Frequently Asked Questions'
  });
};

var changes = function (req, res) {

  var submissions = req.app.get('models').Entry.findAll({
    where: {
      site: req.params.domain,
      year: req.app.get('year'),
      is_current: false
    },
    order: 'updated_at DESC'
  });

  function transformSubmissions(results) {
    // adjust for new ORM objects
    // TODO: check this
    var results = _.each(results, transformToChangeItem);
  }

  function transformToChangeItem(obj, type) {
    var url;
    if (obj.reviewresult === 'accepted') {
      url = '/entry/PLACE/DATASET'
        .replace('PLACE', obj.place)
        .replace('DATASET', obj.dataset);
    } else {
      url = obj.details_url || '/submission/ID'.replace('ID', obj.submissionid);
    }
    return {
      type: type,
      timestamp: obj.timestamp,
      dataset_title: obj.dataset_title,
      place_name: obj.place_name,
      url: url,
      status: obj.reviewresult,
      submitter: obj.submitter,
      reviewer: obj.reviewer
    };
  }

  // TODO: transform submissions - is this still relevant?
  // TODO: fix the promise - I'm just mocking here
  submissions.then(transformSubmissions).then(
    res.render('changes.html', {
      changeitems: submissions
    })
  );

};


var contribute = function (req, res) {

  var text = req.app.get('config').get('contribute_page', req.locale);
  var content = marked(text);

  res.render('base.html', {
    content: content,
    title: 'Contribute'
  });

};


var about = function (req, res) {
  var text = req.app.get('config').get('about_page', req.locale);
  var content = marked(text);
  res.render('base.html', {
    content: content,
    title: 'About'
  });
};


var resultJson = function (req, res) {

  var entries = req.app.get('models').Entry.findAll({
    where: {
      site: req.params.domain,
      year: req.app.get('year'),
      is_current: true
    }
  });

  entries.then(function(results){
    res.json(results);
  });

};

//Show details per country. Extra/different functionality for reviewers.
var place = function (req, res) {

  var place = req.app.get('models').Place.findOne({
    where: {
      id: req.params.place,
      site: req.params.domain
    }
  });

  // TODO: check this works
  place.then(function(result) {
    if (!result) {
      return res.send(404, 'There is no place with ID ' + place + ' in our database. Are you sure you have spelled it correctly? Please check the <a href="/">overview page</a> for the list of places');
    } else {

      var placeEntries;

      var placeSubmissions;

      // TODO: util.translateRows(model.data.datasets, req.locale)
      var placeDatasets;

      // TODO: util.translateRows(model.data.scoredQuestions, req.locale)
      var placeQuestions;

      // TODO: in final promise
      res.render('country/place.html', {
        info: placeEntries,
        datasets: placeDatasets,
        submissions: placeSubmissions,
        entrys: placeEntries, // TODO: ???? check this - what is different from info?
        place: place, // TODO: util.translate(place, req.locale)
        scoredQuestions: placeQuestions,
        loggedin: req.session.loggedin,
        display_year: req.app.get('year')
      });

    }

  });

};

//Show details per dataset
var dataset = function (req, res) {

  var dataset = req.app.get('models').Dataset.findOne({
    where: {
      id: req.params.dataset,
      site: req.params.domain
    }
  });

  function cleanResultSet(results) {
    var lookup = _.pluck(results, 'place'),
        redundants = findRedundants(lookup),
        clean_results = [];

    function sorter(a, b) {
      if (a.ycount > b.ycount)
        return -1;
      if (a.ycount < b.ycount)
        return 1;
      return 0;
    }

    function findRedundants(lookup) {
      var _redundants = [];
      _.each(lookup, function (key) {
        var r;
        r = _.filter(lookup, function (x) {
          if (x === key) {
            return x
          }
        });
        if (r.length > 1) {
          _redundants.push(key);
        }
      });
      return _redundants;
    }

    function removeRedundants(results) {
      _.each(results, function (entry) {
        if (_.contains(redundants, entry.place) &&
            entry.year !== req.app.get('year')) {
          // dont want it!
        } else {
          clean_results.push(entry);
        }
      });
      return clean_results;
    }
    return removeRedundants(results).sort(sorter);
  }

  // TODO: check this works
  dataset.then(function(result) {
    if (!result) {
      return res.send(404, 'Dataset not found. Are you sure you have spelled it correctly?');
    } else {

      // TODO: cleanResultSet(entriesForThisDataset)
      var datasetEntries;

      // TODO: util.translateObject(model.data.placesById, req.locale)
      var datasetPlaces;

      // TODO: util.translateRows(model.data.scoredQuestions, req.locale)
      var datasetQuestions;

      // TODO: util.markup(util.translate(dataset, req.locale))
      var dataset;

      // TODO: in final promise
      res.render('country/dataset.html', {
        bydataset: datasetEntries,
        placesById: datasetPlaces,
        scoredQuestions: datasetQuestions,
        dataset: dataset
      });

    }

  });

};


var entry = function (req, res) {

  // TODO: we could break old urls and lookup entries by uuid
  var entry = req.app.get('models').Entry.findOne({
    where: {
      site: req.params.domain,
      place: req.params.place,
      dataset: req.params.dataset,
      is_current: true
    }
  });

  entry.then(function(result) {
    if (!result) {
      return res.send(404, res.locals.format('There is no entry for %(place)s and %(dataset)s', {
        place: req.params.place,
        dataset: req.params.dataset
      }, req.locale));
    } else {

      // TODO: ynquestions = model.data.questions.slice(0, 9);
      // TODO: util.translateQuestions(ynquestions, req.locale)
      var ynquestions;

      // TODO: util.translateQuestions(model.data.questions, req.locale)
      var questions;

      // TODO: util.translateRows(model.data.scoredQuestions, req.locale)
      var scoredQuestions;

      // TODO: util.translateRows(model.data.datasets, req.locale)
      var datasets;

      // TODO:util.markup(util.translate(dataset, req.locale))
      var dataset;

      // TODO: util.translate(place, req.locale)
      var place;

      res.render('country/entry.html', {
        ynquestions: ynquestions,
        questions: questions,
        scoredQuestions: scoredQuestions,
        datasets: datasets,
        dataset: dataset,
        place: place,
        prefill: entry
      });

    }
  });

}


module.exports = {
  overview: overview,
  faq: faq,
  about: about,
  contribute: contribute,
  changes: changes,
  resultJson: resultJson,
  place: place,
  dataset: dataset,
  entry: entry
}
