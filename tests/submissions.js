var _ = require('lodash'),
    express = require('express'),
    bodyParser = require('body-parser'),
    expressValidator = require('express-validator'),
    chai = require('chai'),
    expect = chai.expect,
    request = require('supertest'),
    validateData = require('../census/controllers/utils').validateData;


function validation(req, res) {
  var errors = validateData(req, true) || {};
  return res.send(errors);
}

var validation_app = function(validation) {

  var port = 8901;
  var app = express();

  app.set('port', port);
  app.use(bodyParser.json());
  app.use(expressValidator({
    customValidators: {
      isChoice: function (value) {
        return ['true', 'false', 'null'].indexOf(value) > -1;
      }
    }
  }));

  app.post('/validate', validation);

  return app;
};

var app = validation_app(validation);

function postRoute(data, done, test) {
  request(app)
    .post("/validate")
    .send(data)
    .end(function(err, res) {
      test(res.body);
      done();
    });
}

describe('#validationData()', function () {

  var sumbission;

  beforeEach(function() {
    sumbission = {
      place: 'ar',
      dataset: 'map',
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

  describe('General', function () {
    it('should not return errors', function (done) {
      postRoute(sumbission, done, function(errors) {
        expect(errors).to.be.eql({});
      });
    });
    it('should return place and dataset errors (empty values)', function(done) {
      postRoute(_.assign(sumbission, {place: '', dataset: ''}), done, function(errors) {
        expect(errors).to.have.property('place');
        expect(errors).to.have.property('dataset');
        expect(_.size(errors)).to.be.equal(2);
      });
    });
    it('should return exists, digital, url (invalid values)', function(done) {
      postRoute(_.assign(sumbission, {
        exists: 'yes', digital: 'no', url: 'example'
      }), done, function(errors) {
        expect(errors).to.have.property('exists');
        expect(errors).to.have.property('digital');
        expect(errors).to.have.property('url');
        expect(_.size(errors)).to.be.equal(3);
      });
    });
  });

  describe('Survey flow', function () {
    it('should return errors for online, machinereadable and bulk (digital=false)', function(done) {
      postRoute(_.assign(sumbission, {digital: 'false'}), done, function(errors) {
        expect(errors).to.have.property('online');
        expect(errors).to.have.property('machinereadable');
        expect(errors).to.have.property('bulk');
        expect(_.size(errors)).to.be.equal(3);
      });
    });
    it('should return errors for free, online, openlicense and bulk (public=false)', function(done) {
      postRoute(_.assign(sumbission, {public: 'false'}), done, function(errors) {
        expect(errors).to.have.property('free');
        expect(errors).to.have.property('online');
        expect(errors).to.have.property('openlicense');
        expect(errors).to.have.property('bulk');
        expect(_.size(errors)).to.be.equal(4);
      });
    });
    it('should return error for openlicense (free=false)', function(done) {
      postRoute(_.assign(sumbission, {free: 'false'}), done, function(errors) {
        expect(errors).to.have.property('openlicense');
        expect(_.size(errors)).to.be.equal(1);
      });
    });
    it('should return error for url (online=true)', function(done) {
      postRoute(_.assign(sumbission, {url: ''}), done, function(errors) {
        expect(errors).to.have.property('url');
        expect(_.size(errors)).to.be.equal(1);
      });
    });
    it('should return error for licenseurl (openlicense=true)', function(done) {
      postRoute(_.assign(sumbission, {licenseurl: ''}), done, function(errors) {
        expect(errors).to.have.property('licenseurl');
        expect(_.size(errors)).to.be.equal(1);
      });
    });
  });

  describe('Edge cases', function () {
    it('should return error for exists and format (the fields are not submitted)', function(done) {
      postRoute(_.omit(sumbission, ['exists', 'format']), done, function(errors) {
        expect(errors).to.have.property('exists');
        expect(errors).to.have.property('format');
        expect(_.size(errors)).to.be.equal(2);
      });
    });
    it("should return error for openlicense (free=null => openlicense=null)", function(done) {
      postRoute(_.assign(sumbission, {free: "null", openlicense: "true"}), done, function(errors) {
        expect(errors).to.have.property('openlicense');
        expect(_.size(errors)).to.be.equal(1);
      });
    });
    it("should return error for url, format, licenseurl " +
       "(online = machinereadable = openlicense = false)", function(done) {
      postRoute(_.assign(sumbission, {
        online: "false", "machinereadable": "false", openlicense: "false"
      }), done, function(errors) {
        expect(errors).to.have.property('url');
        expect(errors).to.have.property('format');
        expect(errors).to.have.property('licenseurl');
        expect(_.size(errors)).to.be.equal(3);
      });
    });
  });

});
