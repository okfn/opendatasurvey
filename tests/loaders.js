'use strict';

const _ = require('lodash');
const assert = require('chai').assert;
const censusConfig = require('../census/config');
const siteID = 'site1';
const REGISTRY_URL = 'https://docs.google.com/spreadsheets/d/1FK5dzeNeJl81oB76n' +
  'WzhS1dAdnXDoZbbe_vTH4NlThM/edit#gid=0';
const testUtils = require('./utils');
const userFixtures = require('../fixtures/user');
const Promise = require('bluebird');

describe('Admin page', function () {
  this.timeout(20000);

  before(testUtils.startApplication);
  after(testUtils.shutdownApplication);

  const configValues = {
    registryUrl: censusConfig.get('registryUrl')
  };

  before(function () {
    let config = testUtils.app.get('config');
    config.set('test:testing', true);
    config.set('test:user', {
      userid: userFixtures[0].data.id,
      emails: userFixtures[0].data.emails
    });
    config.set('registryUrl', REGISTRY_URL);
    this.browser = testUtils.browser;
    this.app = testUtils.app;
  });

  after(function () {
    for (var setting in configValues) {
      censusConfig.set(setting, configValues[setting]);
    }
  });

  before(function() {
    return;
  });

  describe('admin page', function() {
    before(function () {
      return this.browser.visit('/admin');
    });

    it('should load successfully', function () {
      this.browser.assert.success();
      this.browser.assert.text('title', 'Dashboard -');
    });
  });

  describe('reload config button action', function () {
    before(function () {
      return this.browser.visit('/admin');
    });

    before(function () {
      return this.browser.pressButton('Reload Config');
    });

    it('should load config', function () {
      this.browser.assert.success();
      let html = this.browser.resources[0].response.body;
      let jsonData = JSON.parse(html);
      assert.equal(jsonData.status, 'ok');
      assert.equal(jsonData.message, 'ok');
      return this.app.get('models').Site.findById(siteID).then(function (data) {
        assert.isNotNull(data);
        assert.notEqual(data.places, '');
        assert.notEqual(data.places, '');
        assert.notEqual(data.datasets, '');
        assert.notEqual(data.questions, '');
      });
    });
  });

  describe('reload places button action', function () {
    before(function () {
      return this.browser.visit('/admin');
    });

    before(function () {
      return this.browser.pressButton('Reload Places');
    });

    it('should load places', function () {
      this.browser.assert.success();
      let html = this.browser.resources[0].response.body;
      let jsonData = JSON.parse(html);
      assert.equal(jsonData.status, 'ok');
      assert.equal(jsonData.message, 'ok');
      return this.app.get('models').Place.findAll({where: {site: siteID}})
        .then(function (data) {
          assert.equal(data.length, 3);
        });
    });
  });

  describe('reload datasets button action', function () {
    before(function () {
      return this.browser.visit('/admin');
    });

    before(function () {
      return this.browser.pressButton('Reload Datasets (& QuestionSets)');
    });

    it('should load datasets', function () {
      this.browser.assert.success();
      let html = this.browser.resources[0].response.body;
      let jsonData = JSON.parse(html);
      assert.equal(jsonData.status, 'ok');
      assert.equal(jsonData.message, 'ok');
      return this.app.get('models').Dataset.findAll({where: {site: siteID}})
        .then(function (data) {
          assert.equal(data.length, 15);
          let transport = _.find(data, ds => ds.id === 'transport-realtime');
          assert.deepEqual(transport.characteristics, [
            'My first characteristic',
            'Characteristic the second',
            'The third and last of the istics'
          ]);
        });
    });

    it('should create a single QuestionSet instance', function() {
      return this.app.get('models').QuestionSet.findAll({where: {site: siteID}})
        .then(function(qsets) {
          assert.equal(qsets.length, 1);
        });
    });

    it('should association QuestionSet with appropriate datasets', function() {
      return this.app.get('models').QuestionSet.findAll({where: {site: siteID}})
        .bind(this).then(function(qsets) {
          let qsid = qsets[0].id;
          return this.app.get('models').Dataset.findAll(
            {where: {site: siteID, questionsetid: qsid}});
        }).then(datasets => {
          assert.equal(datasets.length, 15);
        });
    });

    it('should load child Question instances into database', function() {
      return this.app.get('models').QuestionSet.findAll({where: {site: siteID}})
      .bind(this).then(qsets => {
        let qsid = qsets[0].id;
        return this.app.get('models').Question.findAll(
          {where: {questionsetid: qsid}});
      })
      .then(questions => {
        assert.equal(questions.length, 16);
      });
    });

    it('adds a dataset.qsurl property from the Dataset sheet', function() {
      // budget dataset has a qsurl value in spreadsheet
      return this.app.get('models').Dataset.findById('budget',
                                                     {where: {site: siteID}})
        .then(function (budgetInstance) {
          assert.isDefined(budgetInstance.qsurl);
          assert.notEqual(budgetInstance.qsurl, '');
          assert.isTrue(budgetInstance.qsurl.startsWith('https://docs.google.com/spreadsheets'));
        });
    });

    it('adds a dataset.qsurl property from the default site config',
    function() {
      // transport dataset doesn't have a qsurl value in spreadsheet, so uses default
      return this.app.get('models').Dataset.findById('transport-realtime',
                                                     {where: {site: siteID}})
        .then(function (transportInstance) {
          assert.isDefined(transportInstance.qsurl);
          assert.notEqual(transportInstance.qsurl, '');
          assert.isTrue(transportInstance.qsurl.startsWith('https://docs.google.com/spreadsheets'));
        });
    });
  });

  describe('reload questionset button action', function() {
    before(function () {
      return this.browser.visit('/admin');
    });

    before(function() {
      return this.browser.pressButton('Reload QuestionSets');
    });

    it('should return with ok status', function() {
      this.browser.assert.success();
      let html = this.browser.resources[0].response.body;
      let jsonData = JSON.parse(html);
      assert.equal(jsonData.status, 'ok');
      assert.equal(jsonData.message, 'ok');
    });

    it('should create a single QuestionSet instance', function() {
      return this.app.get('models').QuestionSet.findAll({where: {site: siteID}})
        .then(function(qsets) {
          assert.equal(qsets.length, 1);
        });
    });

    it('should association QuestionSet with appropriate datasets', function() {
      return this.app.get('models').QuestionSet.findAll({where: {site: siteID}})
        .bind(this).then(function(qsets) {
          let qsid = qsets[0].id;
          return this.app.get('models').Dataset.findAll(
            {where: {site: siteID, questionsetid: qsid}});
        }).then(datasets => {
          assert.equal(datasets.length, 15);
        });
    });

    it('should load child Question instances into database', function() {
      return this.app.get('models').QuestionSet.findAll({where: {site: siteID}})
      .bind(this).then(qsets => {
        let qsid = qsets[0].id;
        return this.app.get('models').Question.findAll(
          {where: {questionsetid: qsid}});
      })
      .then(questions => {
        assert.equal(questions.length, 16);
      });
    });
  });
});

describe('System Control page', function () {
  this.timeout(20000);

  before(testUtils.startApplication);
  after(testUtils.shutdownApplication);

  const configValues = {
    registryUrl: censusConfig.get('registryUrl')
  };
  let appSysAdmin = '';

  before(function () {
    let config = testUtils.app.get('config');
    config.set('test:testing', true);
    config.set('test:user', {
      userid: userFixtures[0].data.id,
      emails: userFixtures[0].data.emails
    });
    config.set('registryUrl', REGISTRY_URL);
    this.browser = testUtils.browser;
    let port = testUtils.app.get('port');
    this.browser.site = 'http://system.dev.census.org:' + port + '/';
    this.app = testUtils.app;
    // temporarily change sysAdmin (reset in `after`)
    appSysAdmin = this.app.get('sysAdmin');
    this.app.set('sysAdmin', userFixtures[0].data.emails);
  });

  after(function () {
    for (var setting in configValues) {
      censusConfig.set(setting, configValues[setting]);
    }
    this.app.set('sysAdmin', appSysAdmin);
  });

  beforeEach(function () {
    return this.browser.visit('/control');
  });

  it('should load admin page successfully', function () {
    this.browser.assert.success();
    this.browser.assert.text('title', 'Dashboard -');
  });

  describe('Load Configs button action', function () {
    beforeEach(function () {
      return this.browser.pressButton('Load Configs');
    });

    it('should load configs', function () {
      this.browser.assert.success();
      let html = this.browser.resources[0].response.body;
      let jsonData = JSON.parse(html);
      assert.equal(jsonData.status, 'ok');
      assert.equal(jsonData.message, 'ok');

      return Promise.join(
        this.app.get('models').Site.count(),
        this.app.get('models').Site.findById(siteID),
        function(count, siteData) {
          assert.equal(count, 2);
          assert.isNotNull(siteData);
          assert.notEqual(siteData.places, '');
          assert.notEqual(siteData.places, '');
          assert.notEqual(siteData.datasets, '');
          assert.notEqual(siteData.questions, '');
        }
      );
    });
  });

  describe('Load Places button action', function () {
    beforeEach(function () {
      return this.browser.pressButton('Load Places');
    });

    it('should load places', function () {
      this.browser.assert.success();
      let html = this.browser.resources[0].response.body;
      let jsonData = JSON.parse(html);
      assert.equal(jsonData.status, 'ok');
      assert.equal(jsonData.message, 'ok');
      return this.app.get('models').Place.findAll({where: {site: siteID}})
        .then(function (data) {
          assert.equal(data.length, 3);
        });
    });
  });

  describe('Load Datasets button action', function () {
    beforeEach(function () {
      return this.browser.pressButton('Load Datasets (& QuestionSets)');
    });

    it('should load datasets and questionsets', function () {
      this.browser.assert.success();
      let html = this.browser.resources[0].response.body;
      let jsonData = JSON.parse(html);
      assert.equal(jsonData.status, 'ok');
      assert.equal(jsonData.message, 'ok');
      return this.app.get('models').Dataset.findAll({where: {site: siteID}})
      .then(function (data) {
        assert.equal(data.length, 15);
      })
      .then(() => {
        return this.app.get('models').QuestionSet.findAll({where: {site: siteID}});
      })
      .then(function(qsets) {
        assert.equal(qsets.length, 1);
      });
    });
  });
});
