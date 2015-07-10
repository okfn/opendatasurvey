'use strict';


var login = function (req, res) {

  req.session.nextUrl = req.app.get('urlTmpl')
      .replace('SCHEME', req.app.get('config').get('connection_scheme'))
      .replace('SUB', req.session.activeSite)
      .replace('DOMAIN', req.app.get('config').get('base_domain'))
      .replace('PATH', req.query.next || '');

  res.render('login.html');

};

var logout = function (req, res) {

  req.logout();

  req.session.nextUrl = req.app.get('urlTmpl')
    .replace('SCHEME', req.app.get('config').get('connection_scheme'))
    .replace('SUB', req.session.activeSite)
    .replace('DOMAIN', req.app.get('config').get('base_domain'))
    .replace('PATH', req.query.next || '');

  res.redirect(req.session.nextUrl);

};

var loggedin = function (req, res) {

  if (req.session.nextUrl) {
    res.redirect(req.session.nextUrl);
  } else {
    res.redirect('/');
  }

};

module.exports = {
  login: login,
  loggedin: loggedin,
  logout: logout
};
