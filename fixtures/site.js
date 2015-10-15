var objects = [
  {
    model: 'Site',
    data: {
      id: 'site1',
      settings: {
        about_page: 'About page very unique string 123',
        faq_page: 'Faq page another unique string with **mark down** 777',
        reviewers: ['email1@example.com', 'email3@example.com']
      }
    }
  },
  {
    model: 'Site',
    data: {
      id: 'site2',
      settings: {
        contribute_page: '# This one is contrubute 555',
        reviewers: ['email2@example.com', 'email4@example.com'],
        submit_page: '~~Submit~~ *page* unique **content**',
        review_page: '*This* is **review** test',
        locales: 'es en uk'
      }
    }
  }
];


module.exports = objects;
