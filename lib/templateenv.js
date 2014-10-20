var nunjucks = require('nunjucks')
  , _ = require('underscore')
  , moment = require('moment')
  , marked = require('marked')
;

var env = new nunjucks.Environment(new nunjucks.FileSystemLoader('templates'));

// linkify plugin for jQuery - automatically finds and changes URLs in text
// content into proper hyperlinks
//
//   Version: 1.0
//
//   Copyright (c) 2009
//     Már Örlygsson (http://mar.anomy.net/) &
//     Hugsmiðjan ehf. (http://www.hugsmidjan.is)
//
// Dual licensed under a MIT licence (http://en.wikipedia.org/wiki/MIT_License)
// and GPL 2.0 or above (http://www.gnu.org/licenses/old-licenses/gpl-2.0.html).
(function () {
  var noProtocolUrl = /(^|["'(\s]|&lt;)(www\..+?\..+?)((?:[:?]|\.+)?(?:\s|$)|&gt;|[)"',])/g,
      httpOrMailtoUrl = /(^|["'(\s]|&lt;)((?:(?:https?|ftp):\/\/|mailto:).+?)((?:[:?]|\.+)?(?:\s|$)|&gt;|[)"',])/g;

  //TODO: Parameterize the targetting
  env.addFilter('urlize', function(str) {
    return str
      .replace(noProtocolUrl, '$1<a href=\'<``>://$2\' target=\'_blank\'>$2</a>$3')  // NOTE: we escape `"http` as `"<``>
      .replace(httpOrMailtoUrl, '$1<a href=\'$2\' target=\'_blank\'>$2</a>$3')
      .replace(/'<``>/g, '\'http');  // reinsert `"http`
  });
}());


// Addition of wordwrap, also missing from nunjucks
// Taken from http://james.padolsey.com/javascript/wordwrap-for-javascript/
env.addFilter('wordwrap', function(str, width, brk, cut) {
  brk = brk || '\n';
  width = width || 75;
  cut = cut || false;
  if (!str) {
    return str;
  }
  var regex = '.{1,' +width+ '}(\\s|$)' + (cut ? '|.{' +width+ '}|.+$' : '|\\S+?(\\s|$)');
  return str.match( RegExp(regex, 'g') ).join( brk );
});

env.addFilter('truncate', function(str, width) {
  width = width || 100;
  if (!str) {
    return str;
  }
  if (str.length <= width) {
    return str;
  } else {
    return str.substr(0,width-1) + "...";
  }
});

// Why? Rotated Heading Cells are hard.
// every token after "halfway" joined with &nbsp;
env.addFilter('rotate', function(str) {
  var parts = str.split(/\s+/)
    , split = Math.ceil(parts.length / 2);

  if (parts.length > 2) {
    return _.first(parts, split).join(' ') +
      '&nbsp;' +
      _.rest(parts, split).join('&nbsp;');
  } else {
    return str;
  }
});

env.addFilter('dateformat', function(str, lang, fmt) {
  fmt = fmt || 'h:mma on Do MMM YYYY';
  lang = lang || 'en';
  return moment(str).lang(lang).format(fmt);
});


// parse the output as markdown
env.addFilter('marked', function(str) {
    return marked(str);
});


// split strings into arrays
env.addFilter('split', function(str) {
    return str.split(',');
});

// parse the output as markdown
env.addFilter('simpledelta', function(str) {
    var now = Date.now(),
    then = new Date(str),
    delta = Math.abs(now - then),
    divider = 24 * 60 * 60 * 1000,
    days = parseInt(delta / divider, 10);

    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else {
      return 'COUNT days ago'.replace('COUNT', days)
    }

});


module.exports = env;
