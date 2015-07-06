'use strict';


var notFound = function(req, res, next) {

  res.status(404)
    .render('404.html', {
      title:'404: Not Found',
      message: 'Nothing here!'
    });

};


var internalServerError = function(err, req, res, next) {

  res.status(500)
    .render('500.html', {
      title:'500: Internal Server Error',
      message: 'Something is up with the server.'
    });

};


module.exports = {
  notFound: notFound,
  internalServerError: internalServerError
};
