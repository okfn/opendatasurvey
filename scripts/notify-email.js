var config = require('../census/config');
var email = require('emailjs');


// WARN Do not export anything when queues are introduced between notifications
// checker and notifications sender, as last one will become standalone process — queue
// message consumer
module.exports = function(type, recepient, options) {
  // Render template

  // Send rendered template as html
  email.server.connect({
    user: config.get('mandrill:smtp_username'),
    password: config.get('mandrill:smtp_password'),
    host: config.get('mandrill:smtp_host'),
    ssl: true
  }).send({
    text: '<Strip tags from html template here>', 
    from: config.get('email_from'), 
    to: recipient,
    subject: options.subject,
    attachment: [{data: '<Rendered template>', alternative:true}]
  });
}