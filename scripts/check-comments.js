var _ = require('lodash');
var config = require('../census/config');
var models = require('../census/models');
var email = require('./email');
var Promise = require('bluebird');

var disqus = new (require('disqus-node'))({
  api_secret: config.get('disqus:api_secret'),
  access_token: config.get('disqus:api_key'),
  logLevel: 'info',
  https: true
});

var URL_REGEXP = RegExp("https?://[^/]+/submission/([0-9ae]+)");

var getSubmissionID = function(url) {
  var match = url.match(URL_REGEXP);
  return match ? match[1] : null;
};

var getSubmissions = function(posts) {
  // return a mapping between submission ids and lists of posts
  var submissions = _.groupBy(posts , function(post) {
    var url = post.thread.link,
        id = getSubmissionID(url);
    if (id === null) {
      console.log("Link " + url + " doesn't match submission URL.");
    }
    return id;
  });
  delete submissions[null];    // remove submissions with invalid urls
  return submissions;
};

var fetchPosts = function(sinceDate) {
  // Get related Disqus threads
  // api: https://disqus.com/api/docs/threads/listPosts/
  return disqus.posts.list({
    forum: config.get('disqus_shortname'),
    related: "thread",
    since: sinceDate.toISOString(),
    order: "asc"
  }).then(function (resp) {
    return resp.response;
  });
};

models.NotificationLog.findOne({where: {type: 'comments'}}).then(function(notification) {
  if (!notification) {
    console.log("No comment entry.");
    return;
  }

  var newLastAt = new Date();

  fetchPosts(notification.lastAt).then(function(posts) {

    var submissions = getSubmissions(posts),
        submissionIDs = _.keys(submissions);

    if (submissionIDs.length === 0) {
      console.log("No new comments.");
      return;
    }

    models.Entry.findAll({
      where: {id: {$in: submissionIDs}},
      include: [{model: models.User, as: "Submitter"}]}).then(function(entries) {

        _.each(entries, function(entry) {
          var message = email.prepareMessage(
            'newcomment.md',
            {
              submitter: entry.Submitter,
              comment: submissions[entry.id][0]
            },
            entry.Submitter.emails[0],
            config.get('email_new_comment_subject'));
          email.send(message);
        });

      });
  }).then(function() {

    notification.updateAttributes({lastAt: newLastAt}).then(function() {
      console.log("NotificationLog updated.");
    });

  });
});
