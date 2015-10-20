var _ = require('lodash');
var expect = require('chai').expect;
var checkComments = require('../scripts/check-comments');
var email = require('../scripts/email');

describe('check-comments', function() {

  describe('#getSubmissionID', function() {
    it('parses URLs and returns submission ids', function() {
      expect(checkComments.getSubmissionID(
        'https://global.census.org/submission/1318931a-02cb-4208-9429-' +
        'd943f9048b65')).to.equal('1318931a-02cb-4208-9429-d943f9048b65');

      expect(checkComments.getSubmissionID(
        'http://global.next-census.okfn.org:80/submission/3E47E9B8-FD85-41E9-' +
        'B56C-DFAE12CBC95C')).to.equal('3E47E9B8-FD85-41E9-B56C-DFAE12CBC95C');

      expect(checkComments.getSubmissionID(
        'https://global.census.org/submission/'))
        .to.equal(null);

      expect(checkComments.getSubmissionID(
        'https://global.census.org/f53b5406-1bf0-41ca-a6a2-b3f4e4ec7d79'))
        .to.equal(null);
    });
  });

  describe('#groupPosts', function() {
    it('maps submission IDs and lists of posts', function() {
      var posts = [
        {
          'thread': {
            link: 'http://global.census.org/submission/3E47E9B8-FD85-41E9-' +
              'B56C-DFAE12CBC95C'
          }
        },
        {
          'thread': {
            link: 'http://global.census.org/submission/a4344cdf-c389-49c0-' +
              'b263-8a668f20ef48'
          }
        },
        {
          'thread': {
            link: 'http://global.census.org/submission/a4344cdf-c389-49c0-' +
              'b263-8a668f20ef48'
          }
        },
        {
          'thread': {
            link: 'http://example.com'
          }
        }
      ];

      var grouped = checkComments.groupPosts(posts);

      expect(grouped).to.have.property('3E47E9B8-FD85-41E9-B56C-DFAE12CBC95C')
        .with.length(1);
      expect(grouped).to.have.property('a4344cdf-c389-49c0-b263-8a668f20ef48')
        .with.length(2);
      expect(grouped).not.to.have.property(null);
      expect(_.size(grouped)).to.equal(2);
    });
  });

});

describe('email', function() {

  describe('#prepareMessage', function() {

    it('creates and returns a message object', function() {
      var message = email.prepareMessage('test.md', {
        var1: 'val1',
        var2: 'val2'
      }, 'test@example.com', 'Hi');
      expect(message).to.have.property('text');
      expect(message.text).to.contain('val1');
      expect(message.text).to.contain('val2');

      expect(message).to.have.property('subject');
      expect(message.subject).to.equal('Hi');

      expect(message).to.have.property('attachment').with.length.above(0);
      expect(message.attachment[0]).to.have.property('data');
      expect(message.attachment[0].data).to.contain('<p>');
      expect(message.attachment[0].data).to.contain('val1');
    });

  });

});
