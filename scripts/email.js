var config = require('../census/config');
var email = require('emailjs');


// WARN Do not export anything when queues are introduced between notifications
// checker and notifications sender, as last one will become standalone process — queue
// message consumer

var prepareMessage = function(template, context, recepient, subject) {
  return {
    text: '<Rendered template>',
    from: config.get('email_from'),
    to: recepient,
    subject: subject,
    attachment: [{data: '<Rendered template>', alternative:true}]
  };
};

var send = function(message) {

  console.log("Sending email to " + message.to);

  // Send rendered template as html
  var server = email.server.connect({
    user: config.get('mandrill:smtp_username'),
    password: config.get('mandrill:smtp_password'),
    host: config.get('mandrill:smtp_host'),
    ssl: true
  });

  server.send(message, function(err, message) { console.log(err || message); });
};


module.exports = {
  prepareMessage: prepareMessage,
  send: send
};
