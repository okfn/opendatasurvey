'use strict';

var _ = require('lodash');
var marked = require('marked');
var modelUtils = require('../models').utils;
var Promise = require('bluebird');


var faq = function (req, res) {

  var qTmpl = req.app.get('view_env').getTemplate('_snippets/questions.html'),
      dTmpl = req.app.get('view_env').getTemplate('_snippets/datasets.html'),
      dataOptions = _.merge(modelUtils.getDataOptions(req), {with: {Entry: false, Place: false}}),
      gettext = res.locals.gettext;

  modelUtils.getData(dataOptions)
    .then(function(data) {
      var qContent = qTmpl.render({gettext: gettext, questions: data.questions}),
          dContent = dTmpl.render({gettext: gettext, datasets: data.datasets}),
          mContent = req.params.site.settings.missing_place_html;
      data.title = 'FAQ - Frequently Asked Questions';
      data.content = marked(req.params.site.settings.faq_page)
        .replace('{{questions}}', qContent)
        .replace('{{datasets}}', dContent)
        .replace('{{missing_place}}', mContent);
      return res.render('base.html', data);
    }).catch(console.log.bind(console));
};


var changes = function (req, res) {

  var entryQueryParams = _.merge(modelUtils.siteQuery(req, true),
                                 {include: [{model: req.app.get('models').User, as: 'Submitter'},
                                            {model: req.app.get('models').User, as: 'Reviewer'}]});

  modelUtils.loadModels({

    places: req.app.get('models').Place.findAll(modelUtils.siteQuery(req)),
    datasets: req.app.get('models').Dataset.findAll(modelUtils.siteQuery(req)),
    entries: req.app.get('models').Entry.findAll(entryQueryParams)

  }).then(function(D) {

    D.entries = _.each(D.entries, function(result, index, list) {

      result.place = _.find(D.places, function(place) {return place.id === result.place;});
      result.dataset = _.find(D.datasets, function(dataset) {return dataset.id === result.dataset;});

      if (result.reviewResult) {
        result.url = '/entry/PLACE/DATASET'
          .replace('PLACE', result.place.id)
          .replace('DATASET', result.dataset.id);
      } else {
        result.url = '/census/submission/ID'.replace('ID', result.id);
      }
    });

    res.render('changes.html', {

      entries: _.sortByOrder(D.entries, 'updatedAt', 'desc'),
      loggedin: req.session.loggedin,
      year: req.app.get('year')

    });

  }).catch(console.log.bind(console));
};


var contribute = function (req, res) {
  res.render('base.html', {
    content: marked(req.params.site.settings.contribute_page),
    title: 'Contribute'
  });
};


var about = function (req, res) {
  res.render('base.html', {
    content: marked(req.params.site.settings.about_page),
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

  /**
   * An overview of data, optionally by year.
   */

  modelUtils.getData(modelUtils.getDataOptions(req))
    .then(function(data) {
      data.urlContext = '';
      if (!req.params.cascade) { data.urlContext += '/YEAR'.replace('YEAR', req.params.year); }
      data.submissionsAllowed = (req.params.year === req.app.get('year'));
      data.extraWidth = data.datasets.length > 12;
      data.customText = req.params.site.settings.overview_page;
      data.missingPlaceText = req.params.site.settings.missing_place_html;
      return res.render('overview.html', data);
    }).catch(console.log.bind(console));
};


var place = function (req, res) {

  /**
   * An overview of places, optionally by year.
   */

  modelUtils.getData(modelUtils.getDataOptions(req))
    .then(function(data) {
      if (!data.place) {
        return res.status(404)
          .send('There is no matching place in our database. ' +
                'Are you sure you have spelled it correctly? Please check the ' +
                '<a href="/">overview page</a> for the list of places');
      }

      data.urlContext = '';
      if (!req.params.cascade) { data.urlContext += '/YEAR'.replace('YEAR', req.params.year); }
      data.loggedin = req.session.loggedin;
      data.year = req.params.year;
      data.submissionsAllowed = (req.params.year === req.app.get('year'));
      data.extraWidth = data.datasets.length > 12;
      return res.render('place.html', data);
    }).catch(console.log.bind(console));
};


var dataset = function (req, res) {

  /**
   * An overview of datasets, optionally by year.
   */

  modelUtils.getData(modelUtils.getDataOptions(req))
    .then(function(data) {
      if (!data.dataset) {
        return res.status(404)
          .send('There is no matching dataset in our database. ' +
                'Are you sure you have spelled it correctly? Please check the ' +
                '<a href="/">overview page</a> for the list of places');
      }

      data.urlContext = '';
      if (!req.params.cascade) { data.urlContext += '/YEAR'.replace('YEAR', req.params.year); }
      data.loggedin = req.session.loggedin;
      data.year = req.params.year;
      data.submissionsAllowed = (req.params.year === req.app.get('year'));
      return res.render('dataset.html', data);
    }).catch(console.log.bind(console));
};


var entry = function (req, res) {

  /**
   * An overview of the current entry for a place/dataset, optionally by year.
   */

  var dataOptions = _.merge(modelUtils.getDataOptions(req), {ynQuestions: false});

  modelUtils.getData(dataOptions)
    .then(function(data) {
      if (!data.entry) {
        return res.status(404)
          .send('There is no matching entry in our database. ' +
                'Are you sure you have spelled it correctly? Please check the ' +
                '<a href="/">overview page</a> for the list of places');
      }

      data.urlContext = '';
      if (!req.params.cascade) { data.urlContext += '/YEAR'.replace('YEAR', req.params.year); }
      data.year = req.params.year;
      data.submissionsAllowed = (req.params.year === req.app.get('year'));
      return res.render('entry.html', data);
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
