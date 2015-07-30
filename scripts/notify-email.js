// WARN Do not export anything when queues are introduced between notifications
// checker and notifications sender, as last one will become standalone process — queue
// message consumer
module.exports = function(recepient, subject, html) {

}