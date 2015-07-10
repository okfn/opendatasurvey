'use strict';

var _ = require('lodash');
var marked = require('marked');
var modelUtils = require('../models').utils;
var Promise = require('bluebird');


var overview = function (req, res) {

  modelUtils.loadModels({

    entries: req.app.get('models').Entry.findAll(modelUtils.siteQuery(req, true)),
    datasets: req.app.get('models').Dataset.findAll(modelUtils.siteQuery(req)),
    places: req.app.get('models').Place.findAll(modelUtils.siteQuery(req)), // TODO: sort places by score for year
    questions: req.app.get('models').Question.findAll(modelUtils.siteQuery(req))

  }).then(function(D) {

    var openEntries = _.where(D.entries, {isCurrent: true}).length,
        byPlace = _.object(_.map(D.places, function(P) { return [P.id, {
          datasets: _.where(D.entries, {place: P.id}).length,
          score: 0
        }]; }));

    res.render('overview.html', {

      places: modelUtils.translateSet(req, D.places),
      datasets: modelUtils.translateSet(req, D.datasets),
      scoredQuestions: modelUtils.translateSet(req, D.questions),
      summary: {
        entries: D.entries.length,
        open: openEntries,
        open_percent: openEntries / D.entries.length || 0,
        places: D.places.length
      },
      extraWidth: D.datasets.length > 12,
      byplace: byPlace,
      custom_text: req.params.site.settings.overview_page,
      missing_place_html: req.params.site.settings.missing_place_html
    });
  });
};


var faq = function (req, res) {

  var qTmpl = req.app.get('view_env').getTemplate('_snippets/questions.html');
  var dTmpl = req.app.get('view_env').getTemplate('_snippets/datasets.html');
  var gettext = res.locals.gettext;

  modelUtils.loadModels({

    datasets: req.app.get('models').Dataset.findAll(modelUtils.siteQuery(req)),
    questions: req.app.get('models').Question.findAll(modelUtils.siteQuery(req))

  }).then(function(D) {

    var qContent = qTmpl.render({gettext: gettext, questions: D.questions});
    var dContent = dTmpl.render({gettext: gettext, datasets: D.datasets});
    var mContent = req.params.site.settings.missing_place_html;
    var content = marked(req.params.site.settings.faq_page)
      .replace('{{questions}}', qContent)
      .replace('{{datasets}}', dContent)
      .replace('{{missing_place}}', mContent);

    res.render('base.html', {
      content: content,
      title: 'FAQ - Frequently Asked Questions'
    });

  });
};


var changes = function (req, res) {

  modelUtils.loadModels({

    places: req.app.get('models').Place.findAll(modelUtils.siteQuery(req)),
    datasets: req.app.get('models').Dataset.findAll(modelUtils.siteQuery(req)),
    entries: req.app.get('models').Entry.findAll(modelUtils.siteQuery(req, true))

  }).then(function(D) {

    if (!D.place) {

      res.send(404, 'There is no place with ID ' + D.place.id + ' in our database. ' +
               'Are you sure you have spelled it correctly? Please check the ' +
               '<a href="/">overview page</a> for the list of places');
      return;

    }

    D.entries = _.each(D.entries, function(result, index, list) {

      var url;
      result.place = _.find(D.places, function(place) {return place.id === result.place;});
      result.dataset = _.find(D.datasets, function(dataset) {return dataset.id === result.dataset;});

      if (result.reviewResult) {
        url = '/entry/PLACE/DATASET'
          .replace('PLACE', result.place.id)
          .replace('DATASET', result.dataset.id);
      } else {
        url = '/submission/ID'.replace('ID', result.id);
      }

    });

    res.render('changes.html', {

      entries: D.entries,
      loggedin: req.session.loggedin,
      year: req.app.get('year')

    });

  });
};


var contribute = function (req, res) {

  var content = marked(req.params.site.settings.contribute_page);

  res.render('base.html', {
    content: content,
    title: 'Contribute'
  });

};


var about = function (req, res) {

  var content = marked(req.params.site.settings.about_page);

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
      isCurrent: true
    }
  });

  entries.then(function(results){
    res.json(results);
  });

};


var place = function (req, res) {

  var placeQueryParams = _.extend(modelUtils.siteQuery(req), {where: {id: req.params.place}});
  var entryQueryParams = _.extend(modelUtils.siteQuery(req, true), {where: {place: req.params.place}});

  modelUtils.loadModels({

    place: req.app.get('models').Place.findOne(placeQueryParams),
    datasets: req.app.get('models').Dataset.findAll(modelUtils.siteQuery(req)),
    questions: req.app.get('models').Question.findAll(modelUtils.siteQuery(req)),
    entries: req.app.get('models').Entry.findAll(entryQueryParams)

  }).then(function(D) {

    if (!D.place) {

      res.send(404, 'There is no place with ID ' + D.place.id + ' in our database. ' +
               'Are you sure you have spelled it correctly? Please check the ' +
               '<a href="/">overview page</a> for the list of places');
      return;

    }

    _.each(D.datasets, function(result, index, list) {
      result.entry = _.find(D.entries, function(entry) {return entry.isCurrent;});
      result.submissions = _.filter(D.entries, function(entry) {return !entry.isCurrent;});
    });

    res.render('place.html', {

      place: D.place.translated(req.locale),
      questions: modelUtils.translateSet(req, D.questions),
      datasets: modelUtils.translateSet(req, D.datasets),
      loggedin: req.session.loggedin,
      year: req.app.get('year')

    });

  });
};


var dataset = function (req, res) {

  var entryQueryParams = _.extend(modelUtils.siteQuery(req, true), {where: {dataset: req.params.dataset}});
  var datasetQueryParams = _.extend(modelUtils.siteQuery(req), {where: {id: req.params.dataset}});

  modelUtils.loadModels({

    dataset: req.app.get('models').Dataset.findOne(datasetQueryParams),
    places: req.app.get('models').Place.findAll(modelUtils.siteQuery(req)),
    questions: req.app.get('models').Question.findAll(modelUtils.siteQuery(req)),
    entries: req.app.get('models').Entry.findAll(entryQueryParams)

  }).then(function(D) {

    if (!D.dataset) {

      res.send(404, 'There is no dataset with ID ' + D.dataset.id + ' in our database. ' +
               'Are you sure you have spelled it correctly? Please check the ' +
               '<a href="/">overview page</a> for the list of datasets');
      return;

    }

    D.datasets = _.each(D.datasets, function(result, index, list) {
      result.entry = _.find(D.entries, function(entry) {return entry.isCurrent;});
      result.submissions = _.filter(D.entries, function(entry) {return !entry.isCurrent;});
    });

    res.render('dataset.html', {

      dataset: D.dataset.translated(req.locale),
      questions: modelUtils.translateSet(req, D.questions),
      places: modelUtils.translateSet(req, D.places),
      year: req.params.year || req.app.get('year')

    });

  });

};


var entry = function (req, res) {

  var entryQueryParams = _.extend(modelUtils.siteQuery(req, true), {where: {dataset: req.params.dataset, place: req.params.place, isCurrent: true}});
  var datasetQueryParams = _.extend(modelUtils.siteQuery(req), {where: {id: req.params.dataset}});
  var placeQueryParams = _.extend(modelUtils.siteQuery(req), {where: {id: req.params.place}});

  modelUtils.loadModels({

    entry: req.app.get('models').Entry.findOne(entryQueryParams),
    place: req.app.get('models').Place.findOne(placeQueryParams),
    dataset: req.app.get('models').Dataset.findOne(datasetQueryParams),
    questions: req.app.get('models').Question.findAll(modelUtils.siteQuery(req))

  }).then(function(D) {

    if (!D.entry) {

      res.send(404, 'There is no matching entry in our database. ' +
               'Please check the <a href="/">overview page</a> for available entries.');
      return;

    }

    D.entry.place = D.place.translated(req.locale);
    D.entry.dataset = D.dataset.translated(req.locale);

    res.render('entry.html', {

      entry: D.entry,
      questions: modelUtils.translateSet(req, D.questions),
      year: req.params.year || req.app.get('year')

    });

  });

};


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
};
