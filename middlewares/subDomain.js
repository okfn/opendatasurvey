var subDomain = {
  checkIfSubDomainExists: function (req, res, next) {
    var subDomain = getSubDomain(req);
    if (subDomain) {
      req.isSubDomainExists = true;
    } else {
      req.isSubDomainExists = false;
    }
    next();
  }
};


function getSubDomain(req) {
  var host = req['headers']['host'];
  var hostParts = host.split('.');
  return hostParts[0];
}
module.exports = subDomain;
