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

var URL_REGEXP = RegExp("https?://[^/]+/census/submission/([0-9a-fA-F-]+)");

var getSubmissionID = function(url) {
  var match = url.match(URL_REGEXP);
  return match ? match[1] : null;
};

var groupPosts = function(posts) {
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

var maybeSendNewCommentNotification = function(entry, comment) {

  if (entry.Submitter.providers !== {"okfn": "anonymous"}) {

    models.Site.findOne({where: {id: entry.site}}).then(function(site) {

        var message = email.prepareMessage(
          'newcomment.md',
          {
            submitter: entry.Submitter,
            comment: comment,
            site: site
          },
          entry.Submitter.emails[0],
          config.get('email_new_comment_subject'));
        email.send(message);
      });

    }
};


var checkComments = function() {

  models.NotificationLog.findOne({where: {type: 'comments'}}).then(function(notification) {
    if (!notification) {
      console.log("No comment entry.");
      return;
    }

    var newLastAt = new Date();

    fetchPosts(notification.lastAt).then(function(posts) {

      var groupedPosts = groupPosts(posts),
          submissionIDs = _.keys(groupedPosts);

      if (submissionIDs.length === 0) {
        console.log("No new comments.");
      }

      models.Entry.findAll({
        where: {id: {$in: submissionIDs}},
        include: [{model: models.User, as: "Submitter"}]}).then(function(entries) {

          Promise.each(entries, function(entry) {

            maybeSendNewCommentNotification(entry, groupedPosts[entry.id][0]);

          }).then(function() {

            notification.updateAttributes({lastAt: newLastAt}).then(function() {
              console.log("NotificationLog updated.");
              models.sequelize.close();  // this makes the script exit instantly
            });

          });
        });
    });
  });

};


if (require.main === module) {
    checkComments();
}
