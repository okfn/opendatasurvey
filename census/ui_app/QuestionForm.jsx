import React from 'react';
import _ from 'lodash';

const QuestionInstructions = React.createClass({
  render() {
    if (this.props.instructionText) {
      return (
      <div className="instructions">
        <div className="collapse" id={'instructions' + this.props.id}>
          <h4>Instructions</h4>
          <span dangerouslySetInnerHTML={{__html: this.props.instructionText}} />
        </div>
        <a className="toggle"
           role="button"
           data-toggle="collapse"
           href={'#instructions' + this.props.id}
           aria-expanded="false"
           aria-controls={'instructions' + this.props.id}>
            <span className="sr-only">Help</span><span className="icon">?</span>
        </a>
      </div>
      );
    }
    return (<div className="instructions"></div>);
  }
});

const QuestionComments = React.createClass({
  render() {
    return (<div className="comments">
      <label htmlFor={this.props.id + '_comment'}>Comments</label>
      <textarea placeholder={this.props.placeholder || 'Add comments' }
                id={this.props.id + '_comment'}
                rows="5"></textarea>
    </div>);
  }
});

// A base Higher-Order Component providing common behaviour for all Question
// Fields.
const baseQuestionField = function(QuestionField) {
  const BaseQuestionField = React.createClass({
    _isSub() {
      return (this.props.position % 1 !== 0);
    },

    getClassValues() {
      var classValue = '';
      if (!this.props.visibleProps.enabled) classValue += 'disabled ';
      if (!this.props.visibleProps.visible) classValue += 'hide ';
      if (this.props.visibleProps.required) classValue += 'required ';
      if (this._isSub()) classValue += 'sub ';
      return _.trim(classValue);
    },

    render() {
      return <QuestionField getClassValues={this.getClassValues}
                            {...this.props}
                            {...this.state} />;
    }
  });
  return BaseQuestionField;
};

let QuestionFieldText = React.createClass({
  render() {
    return (<div className={'text question ' + this.props.getClassValues()}>
      <QuestionInstructions instructionText={this.props.instructions}
                            id={this.props.id} />
      <div className="main">
        <h2>
          <span>{this.props.label}</span> {this.props.children.toString()}
        </h2>
        <div className="answer">
          <input type="text" />
        </div>
      </div>
      <QuestionComments id={this.props.id}
                        placeholder={this.props.placeholder} />
    </div>);
  },

  handler(e) {
    this.props.onChange(this, e.target.value);
  }
});
QuestionFieldText = baseQuestionField(QuestionFieldText);

let QuestionFieldYesNo = React.createClass({
  render() {
    return (<div className={'yes-no question ' + this.props.getClassValues()}>
      <QuestionInstructions instructionText={this.props.instructions}
                            id={this.props.id} />
      <div className="main">
        <h2>
          <span>{this.props.label}</span> {this.props.children.toString()}
        </h2>
        <div className="answer">
          <input type="radio"
                 name={this.props.id}
                 id={this.props.id + '1'}
                 value="No"
                 checked={(this.props.value === 'No')}
                 disabled={!this.props.visibleProps.enabled}
                 onChange={this.handler} />
          <label htmlFor={this.props.id + '1'}>
            <span>No</span>
          </label>
          <input type="radio"
                 name={this.props.id}
                 id={this.props.id + '2'}
                 value="Yes"
                 checked={(this.props.value === 'Yes')}
                 disabled={!this.props.visibleProps.enabled}
                 onChange={this.handler} />
          <label htmlFor={this.props.id + '2'}>
            <span>Yes</span>
          </label>
        </div>
      </div>
      <QuestionComments id={this.props.id}
                        placeholder={this.props.placeholder} />
    </div>);
  },

  handler(e) {
    this.props.onChange(this, e.target.value);
  }
});
QuestionFieldYesNo = baseQuestionField(QuestionFieldYesNo);

const QuestionForm = React.createClass({

  propTypes: {
    questions: React.PropTypes.array.isRequired,
    qsSchema: React.PropTypes.array.isRequired
  },

  getInitialState() {
    var questionValues = this.props.questions.map(q => {
      return {
        id: q.id,
        value: ''
      };
    });
    return {
      questionState: questionValues
    };
  },

  onFieldChange(field, value) {
    // Set the new value for the field
    var newQuestionsState = _.map(this.state.questionState, qState => {
      if (qState.id === field.props.id) qState.value = value;
      return qState;
    });

    this.setState({questionState: newQuestionsState});
  },

  getSchemaForId(id) {
    /*
      Return the schema for `id` from the Question Set Schema object in props.
    */
    return _.find(this.props.qsSchema, qSchema => qSchema.id === id);
  },

  getVisiblePropsForId(id) {
    /*
      Return visible properties (required, enabled, visible) for the question
      with `id`. Value of the properties depends on the value of other
      provider questions, based on the question schema.

      For the sake of clarity, `dependant` objects depend on `provider`
      objects.
    */
    var schema = this.getSchemaForId(id);
    if (schema === undefined) return {};

    // Initially set up return value as the defaultProperties for the schema
    var visProps = _.cloneDeep(schema.defaultProperties);

    // For each dependency in the `if` array in the schema
    _.each(schema.if, dependency => {
      // Find the current state of the provider
      var currentProviderState =
        _.find(this.state.questionState,
               qState => qState.id === dependency.providerId);

      // If the actual value of the provider field is the same as the expected
      // value, and the provider field is enabled and visible...
      var providerVisProps =
        this.getVisiblePropsForId(dependency.providerId);
      if (currentProviderState.value === dependency.value &&
          providerVisProps.enabled &&
          providerVisProps.visible) {
        // Update the return value with the dependency properties.
        _.assign(visProps, dependency.properties);
      }
    }, this);
    return visProps;
  },

  getValueForId(id, key) {
    /*
      Helper to return the value for key from question with `id`.
    */
    return _.result(_.find(this.props.questions, q => q.id === id), key);
  },

  getLabelForId(id) {
    /*
      Return a label for the question schema with `id` (including optional
      prefix), derived from the schema position property.
    */
    var schema = this.getSchemaForId(id);
    if (schema === undefined) return;
    return String(this.props.labelPrefix || '') + String(schema.position) + '.';
  },

  getPositionForId(id) {
    /*
      Return the position for the question schema with `id`.
    */
    var schema = this.getSchemaForId(id);
    if (schema === undefined) return;
    return schema.position;
  },

  render() {
    var questionNodes = this.state.questionState.map(q => {
      // check schema
      if (this.getSchemaForId(q.id) === undefined) {
        console.warn('No schema defined for Question with id: ' + q.id);
      }
      let questionNode = '';
      switch (this.getValueForId(q.id, 'type')) {
        case 'yesno':
          questionNode =
          <QuestionFieldYesNo ref={q.id}
                              key={q.id}
                              id={q.id}
                              visibleProps={this.getVisiblePropsForId(q.id)}
                              value={q.value}
                              onChange={this.onFieldChange}
                              label={this.getLabelForId(q.id)}
                              position={this.getPositionForId(q.id)}
                              instructions={
                                this.getValueForId(q.id, 'description')
                              }
                              placeholder={
                                this.getValueForId(q.id, 'placeholder')
                              }>
            {this.getValueForId(q.id, 'text')}
          </QuestionFieldYesNo>;
          break;
        case 'text':
          questionNode =
          <QuestionFieldText ref={q.id}
                             key={q.id}
                             id={q.id}
                             visibleProps={this.getVisiblePropsForId(q.id)}
                             value={q.value}
                             onChange={this.onFieldChange}
                             label={this.getLabelForId(q.id)}
                             position={this.getPositionForId(q.id)}
                             instructions={
                               this.getValueForId(q.id, 'description')
                             }
                             placeholder={
                               this.getValueForId(q.id, 'placeholder')
                             }>
            {this.getValueForId(q.id, 'text')}
          </QuestionFieldText>;
          break;
        default:
          questionNode =
          <QuestionFieldYesNo ref={q.id}
                              key={q.id}
                              id={q.id}
                              visibleProps={this.getVisiblePropsForId(q.id)}
                              value={q.value}
                              onChange={this.onFieldChange}
                              label={this.getLabelForId(q.id)}
                              position={this.getPositionForId(q.id)}
                              instructions={
                                this.getValueForId(q.id, 'description')
                              }
                              placeholder={
                                this.getValueForId(q.id, 'placeholder')
                              }>
            {this.getValueForId(q.id, 'text')}
          </QuestionFieldYesNo>;
      }
      return questionNode;
    });
    // Sort QuestionField nodes by their position property
    questionNodes = _.sortBy(questionNodes, q => q.props.position);
    return (
      <div className="questionList">
        {questionNodes}
      </div>
    );
  }
});

module.exports = QuestionForm;
