'use strict';

var _ = require('lodash');
var moment = require('moment');
var markedlib = require('marked');

markedlib.setOptions({
  gfm: true,
  sanitize: false
});

var find = function(list, args) {
  return _.find(list, args);
};

var where = function(list, args) {
  return _.where(list, args);
};

var wordwrap = function(str, width, brk, cut) {
  // Addition of wordwrap, also missing from nunjucks
  // Taken from http://james.padolsey.com/javascript/wordwrap-for-javascript/

  brk = brk || '\n';
  width = width || 75;
  cut = cut || false;

  if (!str) {
    return str;
  }
  var regex = '.{1,' + width + '}(\\s|$)' + (cut ? '|.{' + width +
    '}|.+$' : '|\\S+?(\\s|$)');
  return str.match(RegExp(regex, 'g')).join(brk);
};

var truncate = function(str, width) {
  width = width || 100;
  if (!str) {
    return str;
  }
  if (str.length <= width) {
    return str;
  }
  return str.substr(0, width - 1) + '...';
};

// Why? Rotated Heading Cells are hard.
// every token after "halfway" joined with &nbsp;
var rotate = function(str) {
  var parts = str.split(/\s+/);
  var split = Math.ceil(parts.length / 2);

  if (parts.length > 2) {
    return _.first(parts, split).join(' ') + '&nbsp;' +
      _.rest(parts, split).join('&nbsp;');
  }
  return str;
};

var dateformat = function(str, lang, fmt) {
  fmt = fmt || 'h:mma on Do MMM YYYY';
  lang = lang || 'en';
  return moment(str).locale(lang).format(fmt);
};

// parse the output as markdown
var marked = function(str) {
  return markedlib(str);
};

// split strings into arrays
var split = function(str) {
  return str.split(',');
};

var stringify = function(obj) {
  return JSON.stringify(obj);
};

// parse the output as markdown
var simpledelta = function(str) {
  var now = Date.now();
  var then = new Date(str);
  var delta = Math.abs(now - then);
  var divider = 24 * 60 * 60 * 1000;
  var days = parseInt(delta / divider, 10);

  if (days === 0) {
    return 'Today';
  } else if (days === 1) {
    return 'Yesterday';
  }
  return 'COUNT days ago'.replace('COUNT', days);
};

module.exports = {
  find: find,
  where: where,
  wordwrap: wordwrap,
  truncate: truncate,
  rotate: rotate,
  dateformat: dateformat,
  marked: marked,
  split: split,
  simpledelta: simpledelta,
  stringify: stringify
};
