import React from 'react';
import QuestionForm from './QuestionForm.jsx';
import $ from 'jquery';
import * as helpers from './HelperFields.jsx';

const EntryForm = React.createClass({

  _post(targetForm) {
    // disable submit buttons
    $('.submit button').attr('disabled', 'disable');

    let reviewAction =
      $(targetForm).find('button[name=reviewAction]').val();
    let questionsValid = this.refs.questions.validate();
    let yourKnowledgeValid = this.refs.yourKnowledgeQuestions.validate();

    // We can proceed if the form questions are valid, or if we're rejecting
    // the entry.
    if ((questionsValid && yourKnowledgeValid) || reviewAction === 'reject') {
      let form = $('<form>').attr({
        method: 'post', // eslint-disable-line quote-props
        'accept-charset': 'utf-8'
      });

      let questionData = this.refs.questions.state.questionState;
      $('<input>').attr({
        type: 'hidden',
        name: 'answers',
        value: JSON.stringify(questionData)
      }).appendTo(form);

      let aboutYouQuestionData =
        this.refs.yourKnowledgeQuestions.state.questionState;
      $('<input>').attr({
        type: 'hidden',
        name: 'aboutYouAnswers',
        value: JSON.stringify(aboutYouQuestionData)
      }).appendTo(form);

      let additionalInputs = $('.uncontrolled-fields :input').serializeArray();
      for (let i in additionalInputs) {
        if (additionalInputs.hasOwnProperty(i)) {
          $('<input>').attr({
            type: 'hidden',
            name: additionalInputs[i].name,
            value: additionalInputs[i].value
          }).appendTo(form);
        }
      }
      if (this.props.isReview) {
        $('<input>').attr({
          type: 'hidden',
          name: 'reviewAction',
          value: reviewAction
        }).appendTo(form);
      }
      form.appendTo(document.body);
      form.submit();
    } else {
      // Something is invalid, scroll to the first error.
      setTimeout(function() {
        let firstErrorQ = $('.field-errors').first().closest('.question');
        $('html, body').animate({scrollTop: $(firstErrorQ).offset().top}, 750);
      }, 100);

      $('.submit button').removeAttr('disabled');
    }
  },

  onSubmitHandler(e) {
    e.preventDefault();
    this._post(e.target);
  },

  componentWillMount() {
    this.yourKnowledgeQuestions = [
      {
        id: 'yourKnowledgeDomain',
        text: 'Rate your knowledge of ' + this.props.context.datasetName + '.',
        description: '',
        type: 'likert',
        placeholder: 'Κάντε κλικ εδώ για να μας πείτε περισσότερα για το ιστορικό σας. Ποια είναι η γνώση σας για αυτή την κατηγορία δεδομένων και γενικά τα ανοιχτά δεδομένα;',
        config: {
          options: [
            {
              description: 'Δεν είμαι εξοικειωμένος καθόλου με το αντικείμενο αυτό',
              value: '1'
            },
            {
              description: 'Έχω κάποιες γνώσεις για το αντικείμενο αυτό',
              value: '2'
            },
            {
              description: 'Έχω προχωρημένες γνώσεις για το αντικείμενο αυτό',
              value: '3'
            }
          ]
        }
      },
      {
        id: 'yourKnowledgeOpenData',
        text: 'Αξιολογήστε τις γνώσεις σας για τα ανοιχτά δεδομένα.',
        description: '',
        type: 'likert',
        placeholder: '',
        config: {
          options: [
            {
              description: 'Δεν είμαι εξοικειωμένος καθόλου με τα ανοικτά δεδομένα',
              value: '1'
            },
            {
              description: 'Έχω κάποιες γνώσεις για τα ανοικτά δεδομένα',
              value: '2'
            },
            {
              description: 'Έχω προχωρημένες γνώσεις για τα ανοικτά δεδομένα',
              value: '3'
            }
          ]
        }
      }
    ];
    this.yourKnowledgeQSSchema = [
      {
        id: 'yourKnowledgeDomain',
        position: 1,
        defaultProperties: {
          required: true,
          enabled: true,
          visible: true
        },
        ifProvider: []
      },
      {
        id: 'yourKnowledgeOpenData',
        position: 2,
        defaultProperties: {
          required: true,
          enabled: true,
          visible: true
        },
        ifProvider: []
      }
    ];
  },

  render() {
    let readonly = (this.props.isReview && !this.props.canReview);
    let readOnlyOpts = {};
    if (readonly) readOnlyOpts.readOnly = 'readonly';
    return (<div>
<section>
  <div className="container">
    <div className="intro">
      <h1>Ενότητα A - Σχετικά με εσάς</h1>
      <p>Αυτή η ενότητα δεν βαθμολογείται.</p>
    </div>

    <QuestionForm context={this.props.context}
                  qsSchema={this.yourKnowledgeQSSchema}
                  questions={this.yourKnowledgeQuestions}
                  answers={this.props.answers.aboutYouAnswers}
                  readonly={readonly}
                  labelPrefix={'A'}
                  ref={'yourKnowledgeQuestions'} />
  </div>
</section>

<section>
  <div className="container">
    <div className="intro">
      <h1>Ενότητα B - Σχετικά με τα δεδομένα</h1>
    </div>

    <QuestionForm context={this.props.context}
                  qsSchema={this.props.qsSchema}
                  questions={this.props.questions}
                  answers={this.props.answers.answers}
                  readonly={readonly}
                  labelPrefix={'B'}
                  ref={'questions'} />
  </div>
</section>

<footer className="form-footer uncontrolled-fields">
  <input type="hidden" name="place" value={ this.props.place } />
  <input type="hidden" name="dataset" value={ this.props.dataset } />
  <div className="container">
    <div className="text question">
      <div className="instructions"></div>
      <div className="main">
        <div>
          <div className="instructions"></div>
          <h2>Έχετε κάποια άλλα σχόλια; </h2>
        </div>
        <div>
          <helpers.CurrentEntry />
          <div className="answer-wrapper">
            <div className="answer">
              <textarea name="details" rows="5"
                        defaultValue={this.props.answers.details}
                        {...readOnlyOpts}></textarea>
            </div>
          </div>
        </div>
      </div>
      <div className="comments"></div>
    </div>

    <div className="yes-no sub neutral question">
      <div className="main">
        <div>
          <div className="instructions">
            <div className="collapse" id="instructionsAttribution">
              <h4>Instructions</h4>
              <p>By default, submissions to the census are credited to the submitter. If you would prefer to remain anonymous, please indicate so by checking the box.</p>
            </div>
            <a className="toggle" role="button" data-toggle="collapse" href="#instructionsAttribution" aria-expanded="false" aria-controls="instructionsAttribution"><span className="sr-only">Help</span><span className="icon">?</span></a>
          </div>
          <h2>Θα προτιμούσατε την υποβολή σας να παραμείνει ανώνυμη;</h2>
        </div>
        <div>
          <helpers.CurrentEntry />
          <div className="answer-wrapper">
            <div className="answer">
              <input type="radio" name="anonymous"
                     id="anonymousNo"
                     value="No"
                     defaultChecked={this.props.answers.anonymous === 'No'}
                     {...readOnlyOpts} />
              <label htmlFor="anonymousNo">
                <span>No</span>
              </label>
              <input type="radio" name="anonymous"
                     id="anonymousYes"
                     value="Yes"
                     defaultChecked={this.props.answers.anonymous === 'Yes'}
                     {...readOnlyOpts} />
              <label htmlFor="anonymousYes">
                <span>Yes</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      <div className="comments"></div>
    </div>

    <helpers.SubmitActions isReview={this.props.isReview}
                           canReview={this.props.canReview}
                           onSubmitHandler={this.onSubmitHandler}
                           reviewComments={this.props.answers.reviewComments} />

    <helpers.DiscussionLink url={this.props.submissionDiscussionURL} isReview={this.props.isReview} />

  </div>
</footer>
</div>);
  }
});

module.exports = EntryForm;
