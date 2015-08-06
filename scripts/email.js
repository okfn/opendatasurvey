var config = require('../census/config');
var email = require('emailjs');
var nunjucks = require('nunjucks');
var marked = require('marked');

nunjucks.configure(__dirname + '/templates', {watch: false});


var renderTemplate = function(template, context) {
  var text = nunjucks.render(template, context);
  return {
    text: text,
    html: marked(text)
  };
};

var prepareMessage = function(template, context, recepient, subject) {
  var rendered = renderTemplate(template, context);
  return {
    text: rendered.text,
    from: config.get('email_from'),
    to: recepient,
    subject: subject,
    attachment: [{data: rendered.html, alternative:true}]
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

  server.send(message, function(err, message) {
    if (err) {
      console.log(err);
    }
  });
};


module.exports = {
  prepareMessage: prepareMessage,
  send: send
};
