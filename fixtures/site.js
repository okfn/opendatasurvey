var objects = [
  {
    model: 'Site',
    data: {
      id: 'site1',
      settings: {
        places: 'https://docs.google.com/spreadsheets/d/1QvZFGyICiuZmRxVll6peXkND_6QmHl7IQ_BYCw5Sso4/edit#gid=1',
        datasets: 'https://docs.google.com/spreadsheets/d/18mw_Ig9zvwb514VQsTGfrg0WMrcUngxBIRzWSxpguho/edit#gid=0',
        questions: 'https://docs.google.com/spreadsheets/d/1nwmk8uJEK-4K6-5SdBgoLUlUos-BhfYRgjS74YkhDGc/edit#gid=3',
        'about_page': 'About page very unique string 123',
        'faq_page': 'Faq page another unique string with **mark down** 777',
        'overview_page': 'Lorem ipsum for overview page on Site1',
        reviewers: ['email1@example.com', 'email3@example.com'],
        'custom_footer': '<span style="display: none;">Custom footer</span>',
        'custom_css': '/* Custom CSS rules */',
        'navbar_logo': '<span style="display: none;">Custom navbar logo</span>'
      }
    }
  },
  {
    model: 'Site',
    data: {
      id: 'site2',
      settings: {
        places: 'https://docs.google.com/spreadsheets/d/1QvZFGyICiuZmRxVll6peXkND_6QmHl7IQ_BYCw5Sso4/edit#gid=1',
        datasets: 'https://docs.google.com/spreadsheets/d/18mw_Ig9zvwb514VQsTGfrg0WMrcUngxBIRzWSxpguho/edit#gid=0',
        questions: 'https://docs.google.com/spreadsheets/d/1nwmk8uJEK-4K6-5SdBgoLUlUos-BhfYRgjS74YkhDGc/edit#gid=3',
        'contribute_page': '# This one is contrubute 555',
        reviewers: ['email2@example.com', 'email4@example.com'],
        'submit_page': '~~Submit~~ *page* unique **content**',
        'review_page': '*This* is **review** test',
        locales: ['en', 'es', 'uk']
      }
    }
  }
];

module.exports = objects;
