import React from 'react';
import QuestionForm from './QuestionForm.jsx';
import $ from 'jquery';

const EntryForm = React.createClass({

  _post(path) {
    let form = document.createElement('form');
    form.setAttribute('method', 'post');
    form.setAttribute('action', path);

    let questionData = this.refs.questions.state.questionState;
    let answersField = document.createElement('input');
    answersField.setAttribute('type', 'hidden');
    answersField.setAttribute('name', 'answers');
    answersField.setAttribute('value', JSON.stringify(questionData));
    form.appendChild(answersField);

    let additionalInputs = $('.uncontrolled-fields :input').serializeArray();
    for (let i in additionalInputs) {
      if (additionalInputs.hasOwnProperty(i)) {
        let hiddenField = document.createElement('input');
        hiddenField.setAttribute('type', 'hidden');
        hiddenField.setAttribute('name', additionalInputs[i].name);
        hiddenField.setAttribute('value', additionalInputs[i].value);
        form.appendChild(hiddenField);
      }
    }

    document.body.appendChild(form);
    form.submit();
  },

  onSubmitHandler(e) {
    e.preventDefault();
    this._post('.');
  },

  render() {
    return (<form action="." method="post" acceptCharset="utf-8" onSubmit={this.onSubmitHandler}>
<section className="uncontrolled-fields">
  <input type="hidden" name="place" value={ this.props.place } />
  <input type="hidden" name="dataset" value={ this.props.dataset } />

  <div className="container">
    <div className="intro">
      <h1>Section A - About you</h1>
      <p>This section is not scored, but could provide valuable insights.</p>
    </div>

    <div className="scale first question">
      <div className="instructions"></div>
      <div className="main">
        <h2><span>A1.</span> Rate your knowledge of <em>{ this.props.context.datasetName }</em>.</h2>
        <div className="answer">
          <span>
            <input type="radio" name="yourKnowledgeDomain"
                   id="yourKnowledgeDomain1"
                   value="1"
                   defaultChecked={this.props.answers.yourKnowledgeDomain === '1'} />
            <label htmlFor="yourKnowledgeDomain1">
              <span>1</span> <em className="description"> I'm not familiar at all with the field</em>
            </label>
          </span>
          <span>
            <input type="radio" name="yourKnowledgeDomain"
                   id="yourKnowledgeDomain2"
                   value="2"
                   defaultChecked={this.props.answers.yourKnowledgeDomain === '2'} />
            <label htmlFor="yourKnowledgeDomain2">
              <span>2</span> <em className="description">I have some knowledge about the field</em>
            </label>
          </span>
          <span>
            <input type="radio" name="yourKnowledgeDomain"
                   id="yourKnowledgeDomain3"
                   value="3"
                   defaultChecked={this.props.answers.yourKnowledgeDomain === '3'} />
            <label htmlFor="yourKnowledgeDomain3">
              <span>3</span> <em className="description">I have advanced knowledge in this field</em>
            </label>
          </span>
        </div>
      </div>
      <div className="comments">
        <label htmlFor="yourKnowledgeDomainComment" name="yourKnowledgeDomainComment">Comments</label>
        <textarea placeholder="Click here to tell us more about your background. What is your knowledge about the data category, the government in your country, and Open Data in general?"
                  id="yourKnowledgeDomainComment"
                  name="yourKnowledgeDomainComment"
                  rows="5"
                  defaultValue={this.props.answers.yourKnowledgeDomainComment}></textarea>
      </div>
    </div>

    <div className="scale question">
      <div className="instructions"></div>
      <div className="main">
        <h2><span>A2.</span> Rate your knowledge of open data.</h2>
        <div className="answer">
          <span>
            <input type="radio" name="yourKnowledgeOpenData"
                   id="yourKnowledgeOpenData1"
                   value="1"
                   defaultChecked={this.props.answers.yourKnowledgeOpenData === '1'} />
            <label htmlFor="yourKnowledgeOpenData1">
              <span>1</span> <em className="description">I'm not familiar at all with open data</em>
            </label>
          </span>
          <span>
            <input type="radio" name="yourKnowledgeOpenData"
                   id="yourKnowledgeOpenData2"
                   value="2"
                   defaultChecked={this.props.answers.yourKnowledgeOpenData === '2'} />
            <label htmlFor="yourKnowledgeOpenData2">
              <span>2</span> <em className="description">I have some knowledge about open data</em>
            </label>
          </span>
          <span>
            <input type="radio" name="yourKnowledgeOpenData"
                   id="yourKnowledgeOpenData3"
                   value="3"
                   defaultChecked={this.props.answers.yourKnowledgeOpenData === '3'} />
            <label htmlFor="yourKnowledgeOpenData3">
              <span>3</span> <em className="description">I have advanced knowledge</em>
            </label>
          </span>
        </div>
      </div>
      <div className="comments">
        <label htmlFor="yourKnowledgeOpenDataComment">Comments</label>
        <textarea placeholder="Add comments"
                  id="yourKnowledgeOpenDataComment"
                  name="yourKnowledgeOpenDataComment"
                  rows="5"
                  defaultValue={this.props.answers.yourKnowledgeOpenDataComment}></textarea>
      </div>
    </div>
  </div>
</section>

<section>
  <div className="container">
    <div className="intro">
      <h1>Section B - About the data</h1>
    </div>

    <div id="questions"><QuestionForm context={this.props.context}
                                      qsSchema={this.props.qsSchema}
                                      questions={this.props.questions}
                                      answers={this.props.answers.answers}
                                      labelPrefix={'B'}
                                      ref={'questions'} /></div>
  </div>
</section>

<footer className="form-footer uncontrolled-fields">
  <div className="container">
    <div className="text question">
      <div className="instructions"></div>
      <div className="main">
        <h2>Any other comments?</h2>
        <div className="answer">
          <textarea name="details" rows="5"
                    defaultValue={this.props.answers.details}></textarea>
        </div>
      </div>
      <div className="comments"></div>
    </div>

    <div className="yes-no sub neutral question">
      <div className="instructions">
        <div className="collapse" id="instructionsAttribution">
          <h4>Instructions</h4>
          <p>By default, submissions to the census are credited to the submitter. If you would prefer to remain anonymous, please indicate so by checking the box.</p>
        </div>
        <a className="toggle" role="button" data-toggle="collapse" href="#instructionsAttribution" aria-expanded="false" aria-controls="instructionsAttribution"><span className="sr-only">Help</span><span className="icon">?</span></a>
      </div>
      <div className="main">
        <h2>Would you prefer your submission to remain anonymous?</h2>
        <div className="answer">
          <input type="radio" name="anonymous"
                 id="anonymousNo"
                 value="No"
                 defaultChecked={this.props.answers.anonymous === 'No'} />
          <label htmlFor="anonymousNo">
            <span>No</span>
          </label>
          <input type="radio" name="anonymous"
                 id="anonymousYes"
                 value="Yes"
                 defaultChecked={this.props.answers.anonymous === 'Yes'} />
          <label htmlFor="anonymousYes">
            <span>Yes</span>
          </label>
        </div>
      </div>
      <div className="comments">
      </div>
    </div>

    <div className="submit continuation question">
      <div className="instructions"></div>
      <div className="main">
        <p><small>By submitting material to the index you agreeing to <a href="http://okfn.org/terms-of-use/">terms of use</a> and also to license your contribution (to the extent there are any rights in it!) under the <a href="http://opendatacommons.org/licenses/pddl/1.0/">Open Data Commons Public Domain Dedication and License</a>.</small></p>
        <div className="answer">
          <button>Submit</button>
        </div>
      </div>
      <div className="comments">
      </div>
    </div>
  </div>
</footer>
</form>);
  }
});

module.exports = EntryForm;
