'use strict';

/* eslint-disable max-len */

require('jsdom-global')();
const _ = require('lodash');
const React = require('react'); // eslint-disable-line no-unused-vars
const mount = require('enzyme').mount;
const shallow = require('enzyme').shallow;
const expect = require('chai').expect;
const QuestionForm = require('../census/ui_app/QuestionForm');

describe('<QuestionForm />', () => {
  describe('QuestionForm renders each question types', function() {
    beforeEach(function () {
      this.baseQSSchema = [
        {
          defaultProperties: {
            enabled: true,
            required: true,
            visible: true
          },
          id: 'yesno_question',
          position: 1
        }
      ];
      this.baseQuestions = [
        {
          id: 'yesno_question',
          text: 'Is this a yesno question?',
          type: 'yesno'
        }
      ];
    });

    it('renders QuestionFieldYesNo type', function() {
      this.wrapper =
        mount(<QuestionForm questions={this.baseQuestions} qsSchema={this.baseQSSchema} context={{}} />);
      expect(this.wrapper.find('QuestionFieldYesNo')).to.have.length(1);
    });
    it('renders QuestionFieldText type', function() {
      // Replace `type` in baseQuestions.
      this.baseQuestions[0] = _.assign(this.baseQuestions[0], {type: 'text'});
      this.wrapper =
        mount(<QuestionForm questions={this.baseQuestions} qsSchema={this.baseQSSchema} context={{}} />);
      expect(this.wrapper.find('QuestionFieldText')).to.have.length(1);
    });
    it('renders QuestionFieldLikert type', function() {
      // Replace `type` in baseQuestions.
      let question = {type: 'likert', config: [
        {description: 'None', value: '0'},
        {description: 'Some', value: '1'},
        {description: 'All', value: '2'}
      ]};
      this.baseQuestions[0] = _.assign(this.baseQuestions[0], question);
      this.wrapper =
        mount(<QuestionForm questions={this.baseQuestions} qsSchema={this.baseQSSchema} context={{}} />);
      expect(this.wrapper.find('QuestionFieldLikert')).to.have.length(1);
      // Scale has three options.
      expect(this.wrapper.find('QuestionFieldLikertOption')).to.have.length(3);
    });
    it('renders QuestionFieldSource type', function() {
      // Replace `type` in baseQuestions.
      let question = {type: 'source'};
      this.baseQuestions[0] = _.assign(this.baseQuestions[0], question);
      this.wrapper =
        mount(<QuestionForm questions={this.baseQuestions} qsSchema={this.baseQSSchema} context={{}} />);
      expect(this.wrapper.find('QuestionFieldSource')).to.have.length(1);
      // Default has one empty line.
      expect(this.wrapper.find('QuestionFieldSourceLine')).to.have.length(1);
    });
    it('renders QuestionFieldMultipleChoice type with options in config', function() {
      let question = {
        type: 'multiple',
        config: {
          options: ['txt', 'json', 'xls', 'xml']
        }
      };
      this.baseQuestions[0] = _.assign(this.baseQuestions[0], question);
      this.wrapper =
        mount(<QuestionForm questions={this.baseQuestions} qsSchema={this.baseQSSchema} context={{}} />);
      expect(this.wrapper.find('QuestionFieldMultipleChoice')).to.have.length(1);
      expect(this.wrapper.find('QuestionFieldMultipleChoiceOption')).to.have.length(4);
    });
    it('renders QuestionFieldMultipleChoice type with optionsContextKey in config', function() {
      let question = {
        type: 'multiple',
        config: {
          optionsContextKey: 'characteristics'
        }
      };
      let context = {
        characteristics: ['txt', 'json', 'xml']
      };
      this.baseQuestions[0] = _.assign(this.baseQuestions[0], question);
      this.wrapper =
        mount(<QuestionForm questions={this.baseQuestions} qsSchema={this.baseQSSchema} context={context} />);
      expect(this.wrapper.find('QuestionFieldMultipleChoice')).to.have.length(1);
      expect(this.wrapper.find('QuestionFieldMultipleChoiceOption')).to.have.length(3);
    });
  });

  let qsSchema = [
    {
      defaultProperties: {
        enabled: true,
        required: true,
        visible: true
      },
      id: 'like_apples',
      position: 1
    },
    {
      defaultProperties: {
        enabled: false,
        required: false,
        visible: false
      },
      id: 'bananas_instead',
      if: [
        {
          providerId: 'like_apples',
          properties: {
            enabled: true,
            required: true,
            visible: true
          },
          value: 'No'
        }
      ],
      position: 1.1
    },
    {
      defaultProperties: {
        enabled: false,
        required: false,
        visible: true
      },
      id: 'apple_colour',
      if: [
        {
          providerId: 'like_apples',
          properties: {
            enabled: true,
            required: true
          },
          value: 'Yes'
        }
      ],
      position: 2
    },
    {
      defaultProperties: {
        enabled: false,
        required: false,
        visible: true
      },
      id: 'red_apple_today',
      if: [
        {
          providerId: 'apple_colour',
          properties: {
            enabled: true,
            required: true
          },
          value: 'Yes'
        }
      ],
      position: 3
    },
    {
      defaultProperties: {
        enabled: false,
        required: false,
        visible: false
      },
      id: 'doctor_away',
      if: [
        {
          providerId: 'red_apple_today',
          properties: {
            enabled: true,
            visible: true
          },
          value: 'Yes'
        }
      ],
      position: 3.1
    }
  ];

  let questions = [
    {
      id: 'like_apples',
      text: 'Do you like apples?',
      type: 'yesno'
    },
    {
      id: 'bananas_instead',
      text: 'Do you like bananas instead?',
      type: 'yesno'
    },
    {
      id: 'apple_colour',
      text: 'Do you like *RED* apples?',
      type: 'yesno'
    },
    {
      id: 'red_apple_today',
      text: 'Have you eaten a red apple today?',
      type: 'yesno'
    },
    {
      id: 'doctor_away',
      text: 'Did it keep the doctor away?',
      type: 'yesno'
    }
  ];

  describe('QuestionFields have correct initial state', function() {
    beforeEach(function () {
      this.wrapper =
        mount(<QuestionForm questions={questions} qsSchema={qsSchema} context={{}} context={{}} />);
    });

    it('renders list of Questions', function() {
      expect(this.wrapper.find('QuestionFieldYesNo')).to.have.length(5);
    });

    it('first question', function() {
      // first question
      expect(this.wrapper.ref('like_apples').prop('visibleProps').required).is.true;
      expect(this.wrapper.ref('like_apples').prop('visibleProps').enabled).is.true;
      expect(this.wrapper.ref('like_apples').prop('visibleProps').visible).is.true;
    });

    it('second question', function() {
      // second question
      expect(this.wrapper.ref('apple_colour').prop('visibleProps').required).is.false;
      expect(this.wrapper.ref('apple_colour').prop('visibleProps').enabled).is.false;
      expect(this.wrapper.ref('apple_colour').prop('visibleProps').visible).is.true;
    });

    it('third question', function() {
      // third question
      expect(this.wrapper.ref('bananas_instead').prop('visibleProps').required).is.false;
      expect(this.wrapper.ref('bananas_instead').prop('visibleProps').enabled).is.false;
      expect(this.wrapper.ref('bananas_instead').prop('visibleProps').visible).is.false;
    });

    it('fourth question', function() {
      // fourth question
      expect(this.wrapper.ref('red_apple_today').prop('visibleProps').required).is.false;
      expect(this.wrapper.ref('red_apple_today').prop('visibleProps').enabled).is.false;
      expect(this.wrapper.ref('red_apple_today').prop('visibleProps').visible).is.true;
    });

    it('fifth question', function() {
      // fifth question
      expect(this.wrapper.ref('doctor_away').prop('visibleProps').required).is.false;
      expect(this.wrapper.ref('doctor_away').prop('visibleProps').enabled).is.false;
      expect(this.wrapper.ref('doctor_away').prop('visibleProps').visible).is.false;
    });
  });

  describe('QuestionFields have correct state after Q1. "Yes"', function() {
    beforeEach(function () {
      this.wrapper =
        mount(<QuestionForm questions={questions} qsSchema={qsSchema} context={{}} />);
      this.wrapper.ref('like_apples').find('input[value="Yes"]').simulate('change');
    });

    it('first question', function() {
      // first question
      expect(this.wrapper.ref('like_apples').prop('visibleProps').required).is.true;
      expect(this.wrapper.ref('like_apples').prop('visibleProps').enabled).is.true;
      expect(this.wrapper.ref('like_apples').prop('visibleProps').visible).is.true;
    });

    it('second question', function() {
      // second question
      expect(this.wrapper.ref('apple_colour').prop('visibleProps').required).is.true;
      expect(this.wrapper.ref('apple_colour').prop('visibleProps').enabled).is.true;
      expect(this.wrapper.ref('apple_colour').prop('visibleProps').visible).is.true;
    });

    it('third question', function() {
      // third question
      expect(this.wrapper.ref('bananas_instead').prop('visibleProps').required).is.false;
      expect(this.wrapper.ref('bananas_instead').prop('visibleProps').enabled).is.false;
      expect(this.wrapper.ref('bananas_instead').prop('visibleProps').visible).is.false;
    });

    it('fourth question', function() {
      // fourth question
      expect(this.wrapper.ref('red_apple_today').prop('visibleProps').required).is.false;
      expect(this.wrapper.ref('red_apple_today').prop('visibleProps').enabled).is.false;
      expect(this.wrapper.ref('red_apple_today').prop('visibleProps').visible).is.true;
    });

    it('fifth question', function() {
      // fifth question
      expect(this.wrapper.ref('doctor_away').prop('visibleProps').required).is.false;
      expect(this.wrapper.ref('doctor_away').prop('visibleProps').enabled).is.false;
      expect(this.wrapper.ref('doctor_away').prop('visibleProps').visible).is.false;
    });
  });

  describe('QuestionFields have correct state after Q1. "No"', function() {
    beforeEach(function () {
      this.wrapper =
        mount(<QuestionForm questions={questions} qsSchema={qsSchema} context={{}} />);
      this.wrapper.ref('like_apples').find('input[value="No"]').simulate('change');
    });

    it('first question', function() {
      // first question
      expect(this.wrapper.ref('like_apples').prop('visibleProps').required).is.true;
      expect(this.wrapper.ref('like_apples').prop('visibleProps').enabled).is.true;
      expect(this.wrapper.ref('like_apples').prop('visibleProps').visible).is.true;
    });

    it('second question', function() {
      // second question
      expect(this.wrapper.ref('apple_colour').prop('visibleProps').required).is.false;
      expect(this.wrapper.ref('apple_colour').prop('visibleProps').enabled).is.false;
      expect(this.wrapper.ref('apple_colour').prop('visibleProps').visible).is.true;
    });

    it('third question', function() {
      // third question
      expect(this.wrapper.ref('bananas_instead').prop('visibleProps').required).is.true;
      expect(this.wrapper.ref('bananas_instead').prop('visibleProps').enabled).is.true;
      expect(this.wrapper.ref('bananas_instead').prop('visibleProps').visible).is.true;
    });

    it('fourth question', function() {
      // fourth question
      expect(this.wrapper.ref('red_apple_today').prop('visibleProps').required).is.false;
      expect(this.wrapper.ref('red_apple_today').prop('visibleProps').enabled).is.false;
      expect(this.wrapper.ref('red_apple_today').prop('visibleProps').visible).is.true;
    });

    it('fifth question', function() {
      // fifth question
      expect(this.wrapper.ref('doctor_away').prop('visibleProps').required).is.false;
      expect(this.wrapper.ref('doctor_away').prop('visibleProps').enabled).is.false;
      expect(this.wrapper.ref('doctor_away').prop('visibleProps').visible).is.false;
    });
  });

  describe('QuestionFields have correct state after Q1. "Yes" Q2. "Yes', function() {
    beforeEach(function () {
      this.wrapper =
        mount(<QuestionForm questions={questions} qsSchema={qsSchema} context={{}} />);
      this.wrapper.ref('like_apples').find('input[value="Yes"]').simulate('change');
      this.wrapper.ref('apple_colour').find('input[value="Yes"]').simulate('change');
    });

    it('first question', function() {
      // first question
      expect(this.wrapper.ref('like_apples').prop('visibleProps').required).is.true;
      expect(this.wrapper.ref('like_apples').prop('visibleProps').enabled).is.true;
      expect(this.wrapper.ref('like_apples').prop('visibleProps').visible).is.true;
    });

    it('second question', function() {
      // second question
      expect(this.wrapper.ref('apple_colour').prop('visibleProps').required).is.true;
      expect(this.wrapper.ref('apple_colour').prop('visibleProps').enabled).is.true;
      expect(this.wrapper.ref('apple_colour').prop('visibleProps').visible).is.true;
    });

    it('third question', function() {
      // third question
      expect(this.wrapper.ref('bananas_instead').prop('visibleProps').required).is.false;
      expect(this.wrapper.ref('bananas_instead').prop('visibleProps').enabled).is.false;
      expect(this.wrapper.ref('bananas_instead').prop('visibleProps').visible).is.false;
    });

    it('fourth question', function() {
      // fourth question
      expect(this.wrapper.ref('red_apple_today').prop('visibleProps').required).is.true;
      expect(this.wrapper.ref('red_apple_today').prop('visibleProps').enabled).is.true;
      expect(this.wrapper.ref('red_apple_today').prop('visibleProps').visible).is.true;
    });

    it('fifth question', function() {
      // fifth question
      expect(this.wrapper.ref('doctor_away').prop('visibleProps').required).is.false;
      expect(this.wrapper.ref('doctor_away').prop('visibleProps').enabled).is.false;
      expect(this.wrapper.ref('doctor_away').prop('visibleProps').visible).is.false;
    });
  });

  describe('QuestionFields have correct state after Q1. "Yes" Q2. "Yes" Q4. "Yes"', function() {
    beforeEach(function () {
      this.wrapper =
        mount(<QuestionForm questions={questions} qsSchema={qsSchema} context={{}} />);
      this.wrapper.ref('like_apples').find('input[value="Yes"]').simulate('change');
      this.wrapper.ref('apple_colour').find('input[value="Yes"]').simulate('change');
      this.wrapper.ref('red_apple_today').find('input[value="Yes"]').simulate('change');
    });

    it('first question', function() {
      // first question
      expect(this.wrapper.ref('like_apples').prop('visibleProps').required).is.true;
      expect(this.wrapper.ref('like_apples').prop('visibleProps').enabled).is.true;
      expect(this.wrapper.ref('like_apples').prop('visibleProps').visible).is.true;
    });

    it('second question', function() {
      // second question
      expect(this.wrapper.ref('apple_colour').prop('visibleProps').required).is.true;
      expect(this.wrapper.ref('apple_colour').prop('visibleProps').enabled).is.true;
      expect(this.wrapper.ref('apple_colour').prop('visibleProps').visible).is.true;
    });

    it('third question', function() {
      // third question
      expect(this.wrapper.ref('bananas_instead').prop('visibleProps').required).is.false;
      expect(this.wrapper.ref('bananas_instead').prop('visibleProps').enabled).is.false;
      expect(this.wrapper.ref('bananas_instead').prop('visibleProps').visible).is.false;
    });

    it('fourth question', function() {
      // fourth question
      expect(this.wrapper.ref('red_apple_today').prop('visibleProps').required).is.true;
      expect(this.wrapper.ref('red_apple_today').prop('visibleProps').enabled).is.true;
      expect(this.wrapper.ref('red_apple_today').prop('visibleProps').visible).is.true;
    });

    it('fifth question', function() {
      // fifth question
      expect(this.wrapper.ref('doctor_away').prop('visibleProps').required).is.false;
      expect(this.wrapper.ref('doctor_away').prop('visibleProps').enabled).is.true;
      expect(this.wrapper.ref('doctor_away').prop('visibleProps').visible).is.true;
    });
  });

  describe('QuestionForm.canAssignProperties returns as expected', function() {
    beforeEach(function () {
      // Very basic QuestionForm
      this.questionForm = shallow(<QuestionForm questions={[]} qsSchema={[]} context={{}} />);
    });
    it('returns false if dependency and currentState are empty', function() {
      let currentState = {};
      let dependency = {};
      expect(this.questionForm.instance().canAssignProperties(currentState, dependency)).to.be.false;
    });
    it('returns true if dependency.value and currentState.value are the same', function() {
      let currentState = {value: 'my-value'};
      let dependency = {value: 'my-value'};
      expect(this.questionForm.instance().canAssignProperties(currentState, dependency)).to.be.true;
    });
    it('returns false if dependency.value and currentState.value are different', function() {
      let currentState = {value: 'my-value'};
      let dependency = {value: 'my-other-value'};
      expect(this.questionForm.instance().canAssignProperties(currentState, dependency)).to.be.false;
    });

    it('returns false if dependency.isNotEmpty and currentState.value is empty string', function() {
      let currentState = {value: ''};
      let dependency = {isNotEmpty: true};
      expect(this.questionForm.instance().canAssignProperties(currentState, dependency)).to.be.false;
    });
    it('returns false if dependency.isNotEmpty and currentState.value is empty array', function() {
      let currentState = {value: []};
      let dependency = {isNotEmpty: true};
      expect(this.questionForm.instance().canAssignProperties(currentState, dependency)).to.be.false;
    });
    it('returns false if dependency.isNotEmpty and currentState.value is empty object', function() {
      let currentState = {value: {}};
      let dependency = {isNotEmpty: true};
      expect(this.questionForm.instance().canAssignProperties(currentState, dependency)).to.be.false;
    });

    it('returns true if dependency.isNotEmpty and currentState.value is not empty string', function() {
      let currentState = {value: 'not empty'};
      let dependency = {isNotEmpty: true};
      expect(this.questionForm.instance().canAssignProperties(currentState, dependency)).to.be.true;
    });
    it('returns true if dependency.isNotEmpty and currentState.value is not empty array', function() {
      let currentState = {value: ['a', 'b']};
      let dependency = {isNotEmpty: true};
      expect(this.questionForm.instance().canAssignProperties(currentState, dependency)).to.be.true;
    });
    it('returns true if dependency.isNotEmpty and currentState.value is not empty object', function() {
      let currentState = {value: {a: 'hi'}};
      let dependency = {isNotEmpty: true};
      expect(this.questionForm.instance().canAssignProperties(currentState, dependency)).to.be.true;
    });

    it('returns false if dependency.isNotEmpty is false and currentState.value is not empty string', function() {
      let currentState = {value: 'not empty'};
      let dependency = {isNotEmpty: false};
      expect(this.questionForm.instance().canAssignProperties(currentState, dependency)).to.be.false;
    });
    it('returns false if dependency.isNotEmpty is false and currentState.value is not empty array', function() {
      let currentState = {value: ['a', 'b']};
      let dependency = {isNotEmpty: false};
      expect(this.questionForm.instance().canAssignProperties(currentState, dependency)).to.be.false;
    });
    it('returns false if dependency.isNotEmpty is false and currentState.value is not empty object', function() {
      let currentState = {value: {a: 'hi'}};
      let dependency = {isNotEmpty: false};
      expect(this.questionForm.instance().canAssignProperties(currentState, dependency)).to.be.false;
    });

    it('returns true if dependency.isNotEmpty is false and currentState.value is empty string', function() {
      let currentState = {value: ''};
      let dependency = {isNotEmpty: false};
      expect(this.questionForm.instance().canAssignProperties(currentState, dependency)).to.be.true;
    });
    it('returns true if dependency.isNotEmpty is false and currentState.value is empty array', function() {
      let currentState = {value: []};
      let dependency = {isNotEmpty: false};
      expect(this.questionForm.instance().canAssignProperties(currentState, dependency)).to.be.true;
    });
    it('returns true if dependency.isNotEmpty is false and currentState.value is empty object', function() {
      let currentState = {value: {}};
      let dependency = {isNotEmpty: false};
      expect(this.questionForm.instance().canAssignProperties(currentState, dependency)).to.be.true;
    });
  });
});
