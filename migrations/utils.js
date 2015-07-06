// Get CSV row field value by name, according to array of available columns
module.exports.CSVRow = function(object, columns) {
	return function(field) { return object[columns.indexOf(field)]; }
}