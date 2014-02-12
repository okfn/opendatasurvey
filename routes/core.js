var fs = require('fs')
  , path = require('path')
  , _ = require('underscore')
  , express = require('express')
  , flash = require('connect-flash')
  , scrypt = require('scrypt')
  , marked = require('marked')

  , config = require('../lib/config')
  , env = require('../lib/templateenv')
  , model = require('../lib/model').OpenDataCensus
  , util = require('../lib/util')
  ; 

exports.overview = function(req, res) {
  // note: model.data.places and model.data.entries.places are different
  // the latter only has places for which we have some actual results
  res.render('overview.html', {
    summary: model.data.entries.summary,
    places: model.data.places,
    byplace: model.data.entries.byplace,
    datasets: model.data.datasets,
    scoredQuestions: model.data.scoredQuestions,
    placesById: model.data.placesById,
    custom_text: config.get('overview_page')
  });
};

exports.about = function(req, res) {
  var text = config.get('about_page');
  var content = marked(text);
  res.render('base.html', {
    content: content,
    title: 'About'
  });
};

exports.faq = function(req, res) {
  var tmpl = env.getTemplate('_snippets/questions.html');
  var questionInfo = tmpl.render({
    questions: model.data.questions
  });
  var dataTmpl = env.getTemplate('_snippets/datasets.html');
  var dataInfo = dataTmpl.render({
    datasets: model.data.datasets
  });
  var content = marked(config.get('faq_page'));
  content = content.replace('{{questions}}', questionInfo);
  content = content.replace('{{datasets}}', dataInfo);
  res.render('base.html', {
    content: content,
    title: 'FAQ - Frequently Asked Questions'
  });
};

exports.contribute = function(req, res) {
  var text = config.get('contribute_page');
  var content = marked(text);
  res.render('base.html', {
    content: content,
    title: 'Contribute'
  });
};

exports.resultJson = function(req, res) {
  res.json(model.data.entries);
};

//Show details per country. Extra/different functionality for reviewers.
// TODO: want this at simply /country/{place} but need to make sure we don't
// interfere with other urls
exports.place = function(req, res) {
  if (!(req.params.place) in model.data.placesById) {
    res.send(404, 'There is no place with ID ' + place + ' in our database. Are you sure you have spelled it correctly? Please check the <a href="/country/">place page</a> for the list of places');
    return;
  }
  var place = model.data.placesById[req.params.place];

  model.backend.getPlace(place.id, function(err, info) {
    if (err) {
      res.send(500, err);
      return;
    }

    var entrys = {},
        submissions = {};

    // TODO: move this to model
    _.each(model.data.datasets, function(dataset) {
      _.each(info.entrys, function(entry) {
        if (entry.dataset == dataset.id) {
          entry['ycount'] = util.scoreOpenness(model.data, entry);
          entrys[dataset.id] = entry;
        }
      });
      submissions[dataset.id] = _.filter(info.submissions, function(submission) {
        return (submission.dataset == dataset.id);
      });
    });

    res.render('country/place.html', {
      // reviewers: model.data.submissions.reviewersByPlace[place.id],
      // submitters: model.data.submissions.submittersByPlace[place.id],
      info: model.data.entries,
      datasets: model.data.datasets,
      submissions: submissions,
      entrys: entrys,
      place: place,
      scoredQuestions: model.data.scoredQuestions,
      loggedin: req.session.loggedin
    });
  });
};

//Show details per dataset
exports.dataset = function(req, res) {
  var dataset = model.data.datasetsById[req.params.dataset];
  if (!dataset) {
    res.send(404, 'Dataset not found. Are you sure you have spelled it correctly?');
    return;
  }

  model.backend.getEntrys({
    dataset: req.params.dataset,
    year: config.get('display_year')
  }, function(err, entriesForThisDataset) {
    if (err) throw err;
    entriesForThisDataset.forEach(function(entry) {
      entry.ycount = util.scoreOpenness(model.data, entry);
    });
    res.render('country/dataset.html', {
      bydataset: entriesForThisDataset,
      placesById: model.data.placesById,
      scoredQuestions: model.data.scoredQuestions,
      dataset: dataset
    });
  });
};

/* Single Entry Page */
/* TODO: optimize/improve */
exports.entryByPlaceDataset = function(req, res) {
  // TODO: check dataset is in the dataset list o/w 404
  var dataset = model.data.datasets.filter(function(d) {
    return (d.id === req.params.dataset);
  });
  var place = model.data.placesById[req.params.place];
  var ynquestions = model.data.questions.slice(0, 9);

  function render(prefill_) {
    res.render('country/entry.html', {
      ynquestions: ynquestions,
      questions: model.data.questions,
      scoredQuestions: model.data.scoredQuestions,
      datasets: model.data.datasets,
      dataset: dataset,
      place: place,
      prefill: prefill_
    });
  }

  // look up if there is an entry and if so we use it to prepopulate the form
  var prefill = [];

  model.backend.getEntry({
    place: req.params.place,
    dataset: req.params.dataset,
    //TODO: next year, extend to /2013/, etc.
    year: config.get('display_year')
  }, function(err, obj) {
    if (obj) { // we might have a got a 404 etc
      prefill = _.extend(obj, prefill);
    } else {
      res.send(404, 'There is no entry for ' + req.params.place + ' and ' + req.params.dataset);
      return;
    }

    model.backend.getSubmissions({
      place: req.params.place,
      dataset: req.params.dataset,
      //TODO: next year, extend to /2013/, etc.
      year: config.get('display_year')
    }, function(err, obj) {
      // we allow query args to override entry values
      // might be useful (e.g. if we started having form errors and redirecting
      // here ...)
      if (obj) { // we might have a got a 404 etc
        prefill['reviewers'] = [];
        prefill['submitters'] = [];

        _.each(obj, function(val) {
          if (val['reviewer'] !== "") prefill['reviewers'].push(val['reviewer']);
          if (val['submitter'] !== "") prefill['submitters'].push(val['submitter']);
        });

        prefill['reviewers'] = _.uniq(prefill['reviewers']);
        prefill['submitters'] = _.uniq(prefill['submitters']);
        if (prefill['reviewers'].length === 0) prefill['noreviewers'] = true;
        if (prefill['submitters'].length === 0) prefill['nosubmitters'] = true;
        render(prefill);
      } else {
        res.send(404, 'There is no entry for ' + req.params.place + ' and ' + req.params.dataset);
        return;
      }
    });
  });
};
