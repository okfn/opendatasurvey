'use strict';

var _ = require('lodash');
var marked = require('marked');
var modelUtils = require('../models').utils;
var Promise = require('bluebird');


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

  }).catch(console.log.bind(console));
};


var changes = function (req, res) {

  modelUtils.loadModels({

    places: req.app.get('models').Place.findAll(modelUtils.siteQuery(req)),
    datasets: req.app.get('models').Dataset.findAll(modelUtils.siteQuery(req)),
    entries: req.app.get('models').Entry.findAll(modelUtils.siteQuery(req, true))

  }).then(function(D) {

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

  }).catch(console.log.bind(console));
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
      year: req.params.year,
      isCurrent: true
    }
  });

  entries.then(function(results){
    res.json(results);
  }).catch(console.log.bind(console));

};


var overview = function (req, res) {

  var entryQueryParams = _.merge(modelUtils.siteQuery(req, true), {where: {isCurrent: true}});
  var questionQueryParams = _.merge(modelUtils.siteQuery(req), {where: {type: ''}, order: 'score DESC'});

  modelUtils.loadModels({

    entries: req.app.get('models').Entry.findAll(entryQueryParams),
    datasets: req.app.get('models').Dataset.findAll(modelUtils.siteQuery(req)),
    places: req.app.get('models').Place.findAll(modelUtils.siteQuery(req)),
    questions: req.app.get('models').Question.findAll(questionQueryParams)

  }).then(function(D) {

    var placeCount,
        currentEntryCount,
        currentEntryOpenCount,
        openDataPercentCount,
        openDataPercent;

    if (Array.isArray(D.entries)) {

      currentEntryCount = D.entries.length;
      currentEntryOpenCount = _.filter(D.entries, function(e) {return e.isOpen() === true;}).length;
      openDataPercent = parseInt((currentEntryOpenCount / currentEntryCount) * 100, 10);

      _.each(D.entries, function(e) {
        e.computedYCount = e.yCount(D.questions);
      });

    } else {

      currentEntryCount = 0;
      currentEntryOpenCount = 0;
      openDataPercentCount = 0;

    }

    if (Array.isArray(D.places)) {

      placeCount = D.places.length;

      _.each(D.places, function(p) {
        p.computedScore = p.score(D.entries, D.questions);
      });

    } else {

      placeCount = 0;

    }

    res.render('overview.html', {

      placeCount: placeCount,
      currentEntryCount: currentEntryCount,
      currentEntryOpenCount: currentEntryOpenCount,
      openDataPercent: openDataPercent,
      extraWidth: D.datasets > 12,
      customText: req.params.site.settings.overview_page,
      missingPlaceText: req.params.site.settings.missing_place_html,
      places: _.sortByOrder(modelUtils.translateSet(req, D.places), 'computedScore', 'desc'),
      datasets: modelUtils.translateSet(req, D.datasets),
      questions: modelUtils.translateSet(req, D.questions),
      entries: D.entries

    });
  }).catch(console.log.bind(console));
};


var place = function (req, res) {

  var placeQueryParams = _.merge(modelUtils.siteQuery(req), {where: {id: req.params.place}});
  var entryQueryParams = _.merge(modelUtils.siteQuery(req, true),
                                 {where: {place: req.params.place},
                                  include: [{model: req.app.get('models').User, as: 'Submitter'},
                                            {model: req.app.get('models').User, as: 'Reviewer'}]});
  var questionQueryParams = _.merge(modelUtils.siteQuery(req), {where: {type: ''}, order: 'score DESC'});

  modelUtils.loadModels({

    place: req.app.get('models').Place.findOne(placeQueryParams),
    datasets: req.app.get('models').Dataset.findAll(modelUtils.siteQuery(req)),
    questions: req.app.get('models').Question.findAll(questionQueryParams),
    entries: req.app.get('models').Entry.findAll(entryQueryParams)

  }).then(function(D) {

    var reviewers = [],
        submitters = [];

    if (!D.place) {

      res.send(404, 'There is no place with ID ' + D.place.id + ' in our database. ' +
               'Are you sure you have spelled it correctly? Please check the ' +
               '<a href="/">overview page</a> for the list of places');
      return;

    }

    if (Array.isArray(D.entries)) {

      _.each(D.entries, function(e, i, l) {
        e.computedYCount = e.yCount(D.questions);
        reviewers.push(e.reviewer);
        submitters.push(e.submitter);
      });

    }

    D.place.computedScore = D.place.score(D.entries, D.questions);

    res.render('place.html', {

      entries: D.entries,
      place: D.place.translated(req.locale),
      questions: modelUtils.translateSet(req, D.questions),
      datasets: modelUtils.translateSet(req, D.datasets),
      loggedin: req.session.loggedin,
      year: req.params.year,
      submissionsAllowed: (req.params.year === req.app.get('year')),
      reviewers: reviewers,
      submitters: submitters
    });

  }).catch(console.log.bind(console));
};


var dataset = function (req, res) {

  var datasetQueryParams = _.merge(modelUtils.siteQuery(req), {where: {id: req.params.dataset}});
  var entryQueryParams = _.merge(modelUtils.siteQuery(req, true),
                                 {where: {dataset: req.params.dataset},
                                  include: [{model: req.app.get('models').User, as: 'Submitter'},
                                            {model: req.app.get('models').User, as: 'Reviewer'}]});
  var questionQueryParams = _.merge(modelUtils.siteQuery(req), {where: {type: ''}, order: 'score DESC'});

  modelUtils.loadModels({

    dataset: req.app.get('models').Dataset.findOne(datasetQueryParams),
    places: req.app.get('models').Place.findAll(modelUtils.siteQuery(req)),
    questions: req.app.get('models').Question.findAll(questionQueryParams),
    entries: req.app.get('models').Entry.findAll(entryQueryParams)

  }).then(function(D) {

    var reviewers = [],
        submitters = [],
        currentEntries,
        pendingEntries;

    if (!D.dataset) {

      res.send(404, 'There is no dataset with ID ' + D.dataset.id + ' in our database. ' +
               'Are you sure you have spelled it correctly? Please check the ' +
               '<a href="/">overview page</a> for the list of datasets');
      return;

    }

    if (Array.isArray(D.entries)) {

      _.each(D.entries, function(e, i, l) {
        e.computedYCount = e.yCount(D.questions);
        reviewers.push(e.reviewer);
        submitters.push(e.submitter);
      });

    }

    if (Array.isArray(D.places)) {

      _.each(D.places, function(p) {
        p.computedScore = p.score(D.entries, D.questions);
      });

    }

    currentEntries = _.where(D.entries, {'isCurrent': true});
    pendingEntries = _.where(D.entries, {'isCurrent': false, 'reviewed': false, 'reviewResult': true});

    res.render('dataset.html', {

      currentEntries: _.sortByOrder(currentEntries, function(e) {return e.yCount(D.questions);}, 'desc'),
      pendingEntries: _.sortByOrder(pendingEntries, function(e) {return e.yCount(D.questions);}, 'desc'),
      dataset: D.dataset.translated(req.locale),
      questions: modelUtils.translateSet(req, D.questions),
      places: _.sortByOrder(modelUtils.translateSet(req, D.places), 'computedScore', 'desc'),
      year: req.params.year,
      submissionsAllowed: (req.params.year === req.app.get('year'))

    });

  }).catch(console.log.bind(console));

};


var entry = function (req, res) {

  var entryQueryParams = _.merge(modelUtils.siteQuery(req, true), {where: {dataset: req.params.dataset, place: req.params.place, isCurrent: true}});
  var datasetQueryParams = _.merge(modelUtils.siteQuery(req), {where: {id: req.params.dataset}});
  var placeQueryParams = _.merge(modelUtils.siteQuery(req), {where: {id: req.params.place}});
  var questionQueryParams = _.merge(modelUtils.siteQuery(req), {order: 'score DESC'});

  modelUtils.loadModels({

    entry: req.app.get('models').Entry.findOne(entryQueryParams),
    place: req.app.get('models').Place.findOne(placeQueryParams),
    dataset: req.app.get('models').Dataset.findOne(datasetQueryParams),
    questions: req.app.get('models').Question.findAll(questionQueryParams)

  }).then(function(D) {

    if (!D.entry) {

      res.send(404, 'There is no matching entry in our database. ' +
               'Please check the <a href="/">overview page</a> for available entries.');
      return;

    }

    res.render('entry.html', {

      entry: D.entry,
      place: D.place.translated(req.locale),
      dataset: D.dataset.translated(req.locale),
      questions: modelUtils.translateSet(req, D.questions),
      year: req.params.year

    });

  }).catch(console.log.bind(console));

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
