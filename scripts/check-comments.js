var config = require('../census/config');

var disqus = new (require('disqus-node'))({
  api_secret: config.get('disqus:api_secret'),
  access_token: config.get('disqus:api_key'),
  logLevel: 'info',
  https: true
});

// Get all submissions from local DB

// Get related Disqus threads

// Find thos which have new comments, rely on NotificationLog. This routine
// shouldn't be moved to the process which do actual notification through email as that
// process should be generic to be utilized by other notificators.

// Call email notificator passed with recipient, subject, rendered template string

// Upadte NotificationLog