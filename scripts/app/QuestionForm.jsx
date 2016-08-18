import React from 'react';
import _ from 'lodash';

const QuestionField = React.createClass({

  render() {
    return (
      <li className={this._getClassValues()}>
        <p>{this.props.children.toString()}</p>
        <label>
          <span>Yes</span>
          <input type="radio"
                 name={this.props.id}
                 value="Yes"
                 checked={(this.props.value === 'Yes')}
                 disabled={!this.props.visibleProps.enabled}
                 onChange={this.handler} />
        </label>
        <label>
          <span>No</span>
          <input type="radio"
                 name={this.props.id}
                 value="No"
                 checked={(this.props.value === 'No')}
                 disabled={!this.props.visibleProps.enabled}
                 onChange={this.handler} />
        </label>
      </li>
    );
  },

  handler(e) {
    this.props.onChange(this, e.target.value);
  },

  _getClassValues() {
    var classValue = '';
    if (!this.props.visibleProps.enabled) classValue += 'disabled ';
    if (!this.props.visibleProps.visible) classValue += 'hide ';
    if (this.props.visibleProps.required) classValue += 'required ';
    return _.trim(classValue);
  }
});

const QuestionForm = React.createClass({

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

  getVisiblePropsForId(id) {
    /*
      Return visible properties (required, enabled, visible) for the question
      with `id`. Value of the properties depends on the value of other
      provider questions, based on the question schema.

      For the sake of clarity, `dependant` objects depend on `provider`
      objects.
    */

    // Get the schema for this id
    var schema = _.find(this.props.qsSchema, qSchema => qSchema.id === id);

    // Initally set up return value as the defaultProperties for the schema
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

  getTextForId(id) {
    /*
      Return question text for the question with `id`.
    */
    return _.result(_.find(this.props.questions, q => q.id === id), 'text');
  },

  render() {
    var questionNodes = this.state.questionState.map(q => {
      return (
        <QuestionField ref={q.id}
                       key={q.id}
                       id={q.id}
                       visibleProps={this.getVisiblePropsForId(q.id)}
                       value={q.value}
                       onChange={this.onFieldChange}>
          {this.getTextForId(q.id)}
        </QuestionField>
      );
    });
    return (
      <ol className="questionList">
        {questionNodes}
      </ol>
    );
  }
});

export default QuestionForm;
