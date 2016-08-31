'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const config = require('../config');
const utils = require('./utils');
const controllerUtils = require('../controllers/utils');
const marked = require('marked');
const crypto = require('crypto');

var loadConfig = function(siteId, models) {
  return models.Registry.findById(siteId)
  .then(registry => {
    return utils.spreadsheetParsePromise(registry.settings.configurl);
  })
  .then(config => {
    var settings = {};
    var raw = _.object(_.zip(_.pluck(config, 'key'), _.pluck(config, 'value')));
    _.each(raw, function(v, k) {
      if (v && v.toLowerCase() === 'true') {
        settings[k] = true;
      } else if (v && v.toLowerCase() === 'false') {
        settings[k] = false;
      } else if (v && v.toLowerCase() === 'null') {
        settings[k] = null;
      } else if (v && ['reviewers', 'locales'].indexOf(k) !== -1) {
        settings[k] = _.map(v.split(
          controllerUtils.FIELD_SPLITTER), _.trim);
      } else if (v && ['navbar_logo', 'overview_page', 'submit_page',
        'about_page', 'faq_page', 'contribute_page',
        'banner_text', 'tutorial_page'].indexOf(k) !== -1) {
        settings[k] = marked(v);
      } else {
        settings[k] = v;
      }
    });
    // Insert single record — config for required site
    return models.Site.upsert({
      id: siteId,
      settings: settings
    });
  });
};

let _createQuestionsForQuestionSet = function(questionsUrl,
                                              qsId,
                                              models,
                                              transaction) {
  return models.QuestionSet.findById(qsId, {transaction: transaction})
  .then(qset => {
    return models.Question.destroy({
      where: {questionsetid: qsId},
      transaction: transaction
    }).then(() => qset);
  })
  .then(qset => {
    return utils.spreadsheetParsePromise(questionsUrl)
    .then(data => [qset, data]);
  })
  .spread((qset, data) => {
    return Promise.all(
      _.map(data, dataObj => {
        // Allow custom data mapping
        let createData = _.chain(controllerUtils.questionMapper(dataObj,
                                                                qset.site))
        // All records belongs to certain domain
        .extend({
          site: qset.site,
          questionsetid: qset.id
        })
        .pairs()
        // User may mix up lower cased and upper cased field names
        .map(P => [P[0].toLowerCase(), P[1]])
        .object()
        .value();
        return models.Question.create(createData, {transaction: transaction});
      })
    );
  });
};

/*
  A helper function to create a QuestionSet from the parsed quesiton set url,
  and associate it with each dataset in the datasets array.
*/
let _createQuestionSetForDatasets = function(datasets,
                                            qsurl,
                                            siteId,
                                            models,
                                            transaction) {
  return utils.spreadsheetParsePromise(qsurl)
  .then(qsConfig => {
    let raw = _.object(_.zip(_.pluck(qsConfig, 'key'),
                             _.pluck(qsConfig, 'value')));
    // create QuestionSet instance from raw data obj.
    let qsHash = crypto.createHash('sha1').update(siteId + qsurl).digest('hex');
    let qsSchema = JSON.parse(raw.question_set_schema);
    return models.QuestionSet.create({
      id: qsHash,
      site: siteId,
      qsSchema: qsSchema
    }, {transaction: transaction})
    .then(qsInstance => [qsInstance, raw]);
  })
  .spread((qsInstance, raw) => {
    return Promise.each(datasets, ds => {
      return ds.update({questionsetid: qsInstance.id},
                       {transaction: transaction});
    }).then(() => [qsInstance, raw]);
  })
  .spread((qsInstance, raw) => {
    return _createQuestionsForQuestionSet(raw.questions,
                                          qsInstance.id,
                                          models,
                                          transaction);
  });
};

var loadQuestionSets = function(siteId, models) {
  return models.sequelize.transaction(t => {
    // Destroy all QuestionSets associated with siteId.
    return models.QuestionSet.destroy({
      where: {site: siteId},
      transaction: t
    })
    .then(destroyed => {
      // Get the datasets for the site
      return models.Dataset.findAll({
        where: {site: siteId},
        transaction: t
      });
    })
    .then(datasets => {
      // Fetch the qset config at dataset.qsurl for each dataset.
      let qsLoaders = [];
      // Group datasets by their ds.qsurl properties.
      let datasetsByQSUrl = _.groupBy(datasets, ds => ds.qsurl);
      // Create an array of Promises for each qsurl:datasets, to parse the
      // spreadsheet at qsurl and create a QuestionSet object.
      _.each(datasetsByQSUrl, (datasetArr, qsurl) => {
        qsLoaders.push(
          _createQuestionSetForDatasets(datasetArr, qsurl, siteId, models, t)
        );
      });
      // Resolve all the Promises in qsLoaders array.
      return Promise.all(qsLoaders).then(() => {
        // console.log('All QS loaded. Resolving.');
      });
    });
  });
};

var loadRegistry = function(models) {
  var registryUrl = config.get('registryUrl') || false;

  return utils.spreadsheetParse(registryUrl)
    .spread(function(err, registry) {
      if (err) {
        return [err, false];
      }

      if (!registry) {
        return ['could not reload registry', false];
      }

      return models.Registry.count().then(function(C) {
        // Make each upsert (can't do a bulk with upsert,
        // but that is ok for our needs here)
        return Promise.all(_.map(registry, function(R) {
          return new Promise(function(resolve, reject) {
            // Normalize data before upsert
            if (R.adminemail) {
              R.adminemail = _.each(R.adminemail
                .split(controllerUtils.FIELD_SPLITTER),
                function(r) {
                  r.trim();
                });
            }
            models.Registry.upsert(_.extend(R, {
              id: R.censusid,
              settings: _.omit(R, 'censusid')
            })).then(function() {
              resolve(false);
            });
          });
        }));
      });
    });
};

/* Load data and create model instances based on options param.

  e.g. for an options object:
  { mapper: [Function],
  Model: Dataset,
  setting: 'datasets',
  site: 'global' }

  using the config for the site 'global', retrieve data from the spreadsheet
  url defined at setting 'datasets'. Create instances of the Model 'Dataset'
  with the retrieved data, using the optional mapper function.
  */
var loadData = function(options, models) {
  return models.sequelize.transaction(function(t) {
    return models.Site.findById(options.site, {transaction: t}).then(
      function(site) {
        return options.Model.destroy({
          where: {
            site: options.site
          },
          transaction: t
        }).then(function(destroyed) {
          return utils.spreadsheetParse(site.settings[options.setting]).spread(
            function(err, data) {
              if (err) {
                throw err;
              }
              return Promise.all(_.map(data, function(dataObj) {
                return new Promise(function(resolve, reject) {
                  // Allow custom data mapping
                  let createData = _.chain(
                    _.isFunction(options.mapper) ? options.mapper(dataObj, site) : dataObj
                  )
                  // All records belongs to certain domain
                  .extend({site: options.site})
                  .pairs()
                  // User may mix up lower cased and upper cased field names
                  .map(P => [P[0].toLowerCase(), P[1]])
                  .object()
                  .value();
                  return options.Model.create(createData, {transaction: t})
                    .then(resolve).catch(reject);
                });
              }));
            });
        });
      });
  });
};

/* Call loadData with a mapper for translations field.

  There may be translated fields. Map field name <name>@<language>
  into translation: {<language>: {<name>: ..., <another name>: ..., ...}}.
*/
var loadTranslatedData = function(options, models) {
  // Avoid recursive call
  var mapper = options.mapper;

  return models.Site.findById(options.site).then(function(site) {
    return loadData(_.extend(options, {
      mapper: function(D) {
        // Don't forget to call user defined mapper function
        var mapped = _.isFunction(mapper) ? mapper(D, site) : D;

        return _.extend(mapped, {
          translations: _.chain(mapped)
            .pairs()
            .reduce(function(R, P) {
              var fieldLang;
              if (!(P[0].indexOf('@') + 1)) {
                return R;
              }
              fieldLang = P[0].split('@');
              // Default empty dict
              R[fieldLang[1]] = R[fieldLang[1]] || {};
              R[fieldLang[1]][fieldLang[0]] = P[1];
              return R;
            }, {})
            .value()
        });
      }
    }), models);
  });
};

module.exports = {
  loadData: loadData,
  loadTranslatedData: loadTranslatedData,
  loadRegistry: loadRegistry,
  loadConfig: loadConfig,
  loadQuestionSets: loadQuestionSets
};
