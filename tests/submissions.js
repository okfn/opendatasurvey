'use strict';

var _ = require('lodash');
var express = require('express');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var chai = require('chai');
var expect = chai.expect;
var request = require('supertest');
var validateData = require('../census/controllers/utils').validateData;
var models = require('../census/models');
const testUtils = require('./utils');

var validation = function(req, res) {
  validateData(req, true).then(function(errors) {
    return res.send(errors || {});
  });
};

var validationApp = function(validation) {
  var port = 8901;
  var app = express();

  app.set('port', port);
  app.use(bodyParser.json());
  app.use(expressValidator({
    customValidators: {
      isChoice: function(value) {
        return ['true', 'false', 'null'].indexOf(value) > -1;
      }
    }
  }));

  app.post('/validate', validation);

  return app;
};

var app = validationApp(validation);

function postRoute(data, done, test) {
  request(app)
    .post('/validate')
    .send(data)
    .end(function(err, res) {
      test(res.body);
      done();
    });
}

describe('#validationData()', function() {
  var submission;

  before(testUtils.setupFixtures);
  after(testUtils.dropFixtures);

  before(function() {
    app.set('models', models);
  });

  beforeEach(function() {
    submission = {
      place: 'place11',
      dataset: 'dataset11',
      exists: 'true',
      digital: 'true',
      online: 'true',
      machinereadable: 'true',
      format: 'csv',
      bulk: 'true',
      public: 'true',
      free: 'true',
      openlicense: 'true',
      url: 'https://okfn.org/',
      licenseurl: 'http://opensource.org/licenses/AGPL-3.0',
      uptodate: 'true'
    };
  });

  describe('General', function() {
    it('should not return errors', function(done) {
      postRoute(submission, done, function(errors) {
        expect(errors).to.be.eql({});
      });
    });
    it('should return place and dataset errors (empty values)', function(done) {
      postRoute(_.assign(submission, {
        place: '',
        dataset: ''
      }), done, function(errors) {
        expect(errors).to.have.property('place');
        expect(errors).to.have.property('dataset');
        expect(_.size(errors)).to.be.equal(2);
      });
    });
    it('should return place and dataset errors (incorrect values)',
      function(done) {
        // place: 'zz' doesn't exist
        // dataset: 'not-here' doesn't exist
        postRoute(_.assign(submission, {
          place: 'zz',
          dataset: 'not-here'
        }), done, function(errors) {
          expect(errors).to.have.property('place');
          expect(errors).to.have.property('dataset');
          expect(_.size(errors)).to.be.equal(2);
        });
      });
    it('should return exists, digital, url (invalid values)', function(done) {
      postRoute(_.assign(submission, {
        digital: 'foo', online: 'bar', url: 'example'
      }), done, function(errors) {
        expect(errors).to.have.property('digital');
        expect(errors).to.have.property('online');
        expect(errors).to.have.property('url');
        expect(_.size(errors)).to.be.equal(3);
      });
    });
  });

  describe('Survey flow', function() {
    it('should return errors for online, machinereadable and ' +
        'bulk (digital=false)', function(done) {
      postRoute(_.assign(submission, {
        digital: 'false'
      }), done, function(errors) {
        expect(errors).to.have.property('online');
        expect(errors).to.have.property('machinereadable');
        expect(errors).to.have.property('bulk');
        expect(_.size(errors)).to.be.equal(3);
      });
    });
    it('should return errors for free, openlicense (public=false)',
      function(done) {
        postRoute(_.assign(submission, {
          public: 'false'
        }), done, function(errors) {
          expect(errors).to.have.property('free');
          expect(errors).to.have.property('openlicense');
          expect(_.size(errors)).to.be.equal(2);
        });
      });
    it('should return error for openlicense (free=false)', function(done) {
      postRoute(_.assign(submission, {free: 'false'}), done, function(errors) {
        expect(errors).to.have.property('openlicense');
        expect(_.size(errors)).to.be.equal(1);
      });
    });
    it('should return error for empty url (online=true)', function(done) {
      postRoute(_.assign(submission, {url: ''}), done, function(errors) {
        expect(errors).to.have.property('url');
        expect(_.size(errors)).to.be.equal(1);
      });
    });
    it('should return error for empty licenseurl (openlicense=true)',
      function(done) {
        postRoute(_.assign(submission, {
          licenseurl: ''
        }), done, function(errors) {
          expect(errors).to.have.property('licenseurl');
          expect(_.size(errors)).to.be.equal(1);
        });
      });
    it('should return error for empty format (machinereadable=true)',
      function(done) {
        postRoute(_.assign(submission, {
          format: ''
        }), done, function(errors) {
          expect(errors).to.have.property('format');
          expect(_.size(errors)).to.be.equal(1);
        });
      });
  });

  describe('expectFalse cases', function() {
    it('should return no error (public=true => openlicense=true)',
      function(done) {
        postRoute(_.assign(submission, {
          public: 'true',
          openlicense: 'true'
        }), done, function(errors) {
          expect(_.size(errors)).to.be.equal(0);
        });
      });

    it('should return no error (public=true => openlicense=false; ' +
      'licenseurl = "")', function(done) {
      postRoute(_.assign(submission, {
        public: 'true',
        openlicense: 'false',
        licenseurl: ''
      }), done, function(errors) {
        expect(_.size(errors)).to.be.equal(0);
      });
    });

    it('should return no error (public=true => openlicense=null; ' +
      'licenseurl: "")', function(done) {
      postRoute(_.assign(submission, {
        public: 'true',
        openlicense: 'null',
        licenseurl: ''
      }), done, function(errors) {
        expect(_.size(errors)).to.be.equal(0);
      });
    });

    it('should return no error (public=null => openlicense=null; ' +
      'licenseurl: "")', function(done) {
      postRoute(_.assign(submission, {
        public: 'null',
        openlicense: 'null',
        licenseurl: ''
      }), done, function(errors) {
        expect(_.size(errors)).to.be.equal(0);
      });
    });

    it('should return no error (public=null => openlicense=false; ' +
      'licenseurl: "")', function(done) {
      postRoute(_.assign(submission, {
        public: 'null',
        openlicense: 'false',
        licenseurl: ''
      }), done, function(errors) {
        expect(_.size(errors)).to.be.equal(0);
      });
    });

    it('should return no error (public=null => openlicense=true)',
      function(done) {
        postRoute(_.assign(submission, {
          public: 'null',
          openlicense: 'true'
        }), done, function(errors) {
          expect(_.size(errors)).to.be.equal(0);
        });
      });

    it('should return no error (public=false => openlicense=false; ' +
      'online=false; free=false; openlicense=false; bulk=false)',
      function(done) {
        postRoute(_.assign(submission, {
          public: 'false',
          free: 'false',
          openlicense: 'false',
          online: 'false',
          url: '',
          licenseurl: '',
          bulk: 'false'}
        ), done, function(errors) {
          expect(_.size(errors)).to.be.equal(0);
        });
      });

    it('should return error for free (public=false => openlicense=false; ' +
      'online=false; free=true; openlicense=false; bulk=false)',
      function(done) {
        postRoute(_.assign(submission, {
          public: 'false',
          free: 'true',
          openlicense: 'false',
          online: 'false',
          url: '',
          licenseurl: '',
          bulk: 'false'}
        ), done, function(errors) {
          expect(errors).to.have.property('free');
          expect(_.size(errors)).to.be.equal(1);
        });
      });

    it('should return error for free (public=false => openlicense=false; ' +
      'online=false; free=null; openlicense=false; bulk=false)',
      function(done) {
        postRoute(_.assign(submission, {
          public: 'false',
          free: 'null',
          openlicense: 'false',
          online: 'false',
          url: '',
          licenseurl: '',
          bulk: 'false'}
        ), done, function(errors) {
          expect(errors).to.have.property('free');
          expect(_.size(errors)).to.be.equal(1);
        });
      });

    it('should return error for openlicense, licenseurl (public=false => ' +
      'openlicense=true; online=false; free=true; bulk=false)',
      function(done) {
        postRoute(_.assign(submission, {
          public: 'false',
          free: 'false',
          openlicense: 'true',
          online: 'false',
          url: '',
          licenseurl: '',
          bulk: 'false'}
        ), done, function(errors) {
          expect(errors).to.have.property('openlicense');
          expect(errors).to.have.property('licenseurl');
          expect(_.size(errors)).to.be.equal(2);
        });
      });

    it('should return no error (exists=null => digital=null; ' +
      'public=null; uptodate=null)', function(done) {
      postRoute(_.assign(submission, {
        exists: 'null',
        digital: 'null',
        public: 'null',
        uptodate: 'null'
      }), done, function(errors) {
        expect(_.size(errors)).to.be.equal(0);
      });
    });

    it('should return error for digital (exists=null => digital=true; ' +
      'public=null; uptodate=null)', function(done) {
      postRoute(_.assign(submission, {
        exists: 'null',
        digital: 'true',
        public: 'null',
        uptodate: 'null'
      }), done, function(errors) {
        expect(errors).to.have.property('digital');
        expect(_.size(errors)).to.be.equal(1);
      });
    });
  });

  describe('Edge cases', function() {
    it('should return error for exists and format (the fields are ' +
    'not submitted)', function(done) {
      postRoute(_.omit(submission, ['exists', 'format']), done,
        function(errors) {
          expect(errors).to.have.property('exists');
          expect(errors).to.have.property('format');
          expect(_.size(errors)).to.be.equal(2);
        });
    });

    it('should return error for openlicense (free=null => openlicense=null)',
      function(done) {
        postRoute(_.assign(submission, {
          free: 'null',
          openlicense: 'null'
        }), done, function(errors) {
          expect(errors).to.have.property('licenseurl');
          expect(_.size(errors)).to.be.equal(1);
        });
      });

    it('should return error for url, format, licenseurl ' +
       '(online = machinereadable = openlicense = false)', function(done) {
      postRoute(_.assign(submission, {
        online: 'false', machinereadable: 'false', openlicense: 'false'
      }), done, function(errors) {
        expect(errors).to.have.property('url');
        expect(errors).to.have.property('format');
        expect(errors).to.have.property('licenseurl');
        expect(_.size(errors)).to.be.equal(3);
      });
    });
  });
});
