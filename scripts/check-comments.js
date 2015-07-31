var _ = require('lodash');
var config = require('../census/config');

var disqus = new (require('disqus-node'))({
  api_secret: config.get('disqus:api_secret'),
  access_token: config.get('disqus:api_key'),
  logLevel: 'info',
  https: true
});

var models = require('../census/models');
var moment = require('moment');
var notify = require('./notify-email');


models.NotificationLog.findOne({where: {type: 'comments'}}).then(function(N) {
  // Get all submissions from local DB
  models.Entry.findAll({
    include: [{model: models.User, as: 'Submitter'}],
    where: {isCurrent: false}
  }).then(function(D) {
    D.forEach(function(E) {
      if(!E.Submitter)
        return false;

      console.log(['Processing', E.id, 'submitted by', E.Submitter.firstName, E.lastName].join(' '));

      // Get related Disqus threads
      disqus.posts.list({
        forum: config.get('disqus_shortname'),

        // https://disqus.com/api/docs/threads/listPosts/
        thread: 'link:<Submission URLneed to be generated here>'
      }).then(function (R) {
        // Find those which have new comments, rely on NotificationLog. This routine
        // shouldn't be moved to the process which do actual notification through email as that
        // process should be generic to be utilized by other notificators.
        if(_.any(R.response, function(P) {
          return !N || moment(P.created_at,  moment.ISO_8601).isAfter(N.lastAt);
        }))

          // Call email notificator passed with recipient, subject, rendered template string
          notify('comments', E.Submitter.emails[0], {
            subject: 'Subject',
            template: 'imported template string',
            templateContext: {template: 'context'}
          });
      });
    });

    // Update NotificationLog after all Entries are walked through and all Disqus 
    // requests are done
  });
});
