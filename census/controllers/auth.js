'use strict';


var login = function (req, res) {
  // TODO: use this stored next url properly ...
  req.session.nextUrl = req.query.next;
  res.render('login.html', {
    anonymous_submissions: req.app.get('config').get('anonymous_submissions') === 'TRUE'
  });
};

var logout = function (req, res) {
  req.logout();
  res.redirect('/');
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
}
