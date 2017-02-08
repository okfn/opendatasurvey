'use strict';

const _ = require('lodash');
const AWS = require('aws-sdk');
const Promise = require('bluebird');

const debug = require('debug')('metalsmith-godi-ensurebucket');

module.exports = plugin;

/**
 * GODI Metalsmith plugin that ensures the passed bucketname exists.
 *
 * @return {Function}
 */

let ensureBucket = function(bucketName) {
  /*
    Ensure a bucket exists with name `bucketName`.
  */

  const s3 = new AWS.S3({apiVersion: '2006-03-01'});
  const params = {Bucket: bucketName};

  return new Promise((res, rej) => {
    s3.headBucket(params).promise()
    .then(data => {
      debug('Bucket \'' + bucketName + '\' exists.');
      res(data);
    })
    .catch(err => {
      if (err.code === 'NotFound') {
        // create the bucket here.
        const createParams = _.clone(params);
        params.ACL = 'public-read';
        s3.createBucket(createParams).promise()
        .then(data => {
          debug('Created bucket: ' + bucketName);
          res(data);
        })
        .catch(err => {
          rej(err);
        });
      } else {
        rej(err);
      }
    });
  });
};

let ensureWebsite = function(bucketName) {
  /*
    Ensure the bucket with name `bucketName` is set up as a static website.
  */

  const s3 = new AWS.S3({apiVersion: '2006-03-01'});
  const params = {Bucket: bucketName};

  return new Promise((res, rej) => {
    s3.getBucketWebsite(params).promise()
    .then(data => {
      debug('Bucket has website configuration.');
      res(data);
    })
    .catch(err => {
      if (err.code === 'NoSuchWebsiteConfiguration') {
        debug('No website configured for bucket. Attempting to add one.');
        const createParams = _.clone(params);
        createParams.WebsiteConfiguration = {
          // ErrorDocument: {
          //   Key: 'STRING_VALUE' /* required */
          // },
          IndexDocument: {
            Suffix: 'index.html'
          }
        };
        s3.putBucketWebsite(createParams).promise()
        .then(data => {
          debug('Added Website configuration for bucket, ' + bucketName);
          res(data);
        })
        .catch(err => rej(err));
      } else {
        rej(err);
      }
    });
  });
};

let ensurePermissions = function(bucketName) {
  /*
    Ensure bucketName has appropriate permissions to be viewed as a static
    website.
  */
  const s3 = new AWS.S3({apiVersion: '2006-03-01'});
  const params = {
    Bucket: bucketName
  };
  const policy = {
    Statement: {
      Sid: 'AddPublicReadPermissions',
      Effect: 'Allow',
      Principal: '*',
      Action: 's3:GetObject',
      Resource: 'arn:aws:s3:::' + bucketName + '/*'
    }
  };
  params.Policy = JSON.stringify(policy);

  return new Promise((res, rej) => {
    s3.putBucketPolicy(params).promise()
    .then(data => {
      debug('Added Public Read Policy to bucket, ' + bucketName);
      res(data);
    })
    .catch(err => {
      rej(err);
    });
  });
};

function plugin(options) {
  return (files, metalsmith, done) => {
    ensureBucket(options.bucketName)
    .then(data => {
      return ensureWebsite(options.bucketName);
    })
    .then(data => {
      return ensurePermissions(options.bucketName);
    })
    .then(data => done())
    .catch(err => done(err));
  };
}
