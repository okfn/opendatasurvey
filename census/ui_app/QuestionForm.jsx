import React from 'react';
import _ from 'lodash';
import * as fields from './QuestionFields.jsx';

const QuestionForm = React.createClass({

  propTypes: {
    questions: React.PropTypes.array.isRequired,
    qsSchema: React.PropTypes.array.isRequired,
    context: React.PropTypes.object.isRequired
  },

  getInitialState() {
    let questionValues = this.props.questions.map(q => {
      return {
        id: q.id,
        value: _.get(this.props.answers[q.id], 'value', ''),
        commentValue: _.get(this.props.answers[q.id], 'commentValue', '')
      };
    });
    return {
      questionState: questionValues
    };
  },

  onFieldChange(field, value) {
    // Set the new value for the field
    let newQuestionsState = _.map(this.state.questionState, qState => {
      if (qState.id === field.props.id) qState.value = value;
      return qState;
    });

    this.setState({questionState: newQuestionsState});
  },

  onCommentChange(field, value) {
    // Set the new value for the field
    let newQuestionsState = _.map(this.state.questionState, qState => {
      if (qState.id === field.props.id) qState.commentValue = value;
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

  canAssignProperties(currentProviderState, dependency) {
    /*
      Determine if the passed dependency should assign visible properties
      based on the currentProviderState object.

      dependency objects can have a `value` property, which compares against
      the currentProviderState.value, or a `isNotEmpty` property, which is
      used to check whether currentProviderState.value is empty or not.
    */
    let canAssign = false;
    if (_.has(dependency, 'value') &&
        currentProviderState.value === dependency.value) {
      canAssign = true;
    }
    if (_.has(dependency, 'isNotEmpty') &&
        dependency.isNotEmpty === !_.isEmpty(currentProviderState.value)) {
      canAssign = true;
    }
    return canAssign;
  },

  getVisiblePropsForId(id) {
    /*
      Return visible properties (required, enabled, visible) for the question
      with `id`. Value of the properties depends on the value of other
      provider questions, based on the question schema.

      For the sake of clarity, `dependant` objects depend on `provider`
      objects.
    */
    let schema = this.getSchemaForId(id);
    if (schema === undefined) return {};

    // Initially set up return value as the defaultProperties for the schema
    let visProps = _.cloneDeep(schema.defaultProperties);

    // For each dependency in the `ifProvider` array in the schema
    _.each(schema.ifProvider, dependency => {
      // Find the current state of the provider
      let currentProviderState =
        _.find(this.state.questionState,
               qState => qState.id === dependency.providerId);

      // If the actual value of the provider field is the same as the expected
      // value, and the provider field is enabled and visible...
      let providerVisProps =
        this.getVisiblePropsForId(dependency.providerId);

      if (this.canAssignProperties(currentProviderState, dependency) &&
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
    let schema = this.getSchemaForId(id);
    if (schema === undefined) return;
    return String(this.props.labelPrefix || '') + String(schema.position) + '.';
  },

  getPositionForId(id) {
    /*
      Return the position for the question schema with `id`.
    */
    let schema = this.getSchemaForId(id);
    if (schema === undefined) return;
    return schema.position;
  },

  render() {
    let questionNodes = this.state.questionState.map(q => {
      // check schema
      if (this.getSchemaForId(q.id) === undefined) {
        console.warn('No schema defined for Question with id: ' + q.id);
      }
      // Map question.type to appropriate React Component class.
      const typesToComponent = {
        yesno: fields.QuestionFieldYesNo,
        text: fields.QuestionFieldText,
        likert: fields.QuestionFieldLikert,
        source: fields.QuestionFieldSource,
        multiple: fields.QuestionFieldMultipleChoice
      };
      const type = this.getValueForId(q.id, 'type');
      let ComponentClass = typesToComponent.yesno;
      if (_.has(typesToComponent, type)) {
        ComponentClass = typesToComponent[type];
      }
      return (
        <ComponentClass ref={q.id}
                        key={q.id}
                        id={q.id}
                        visibleProps={this.getVisiblePropsForId(q.id)}
                        value={q.value}
                        commentValue={q.commentValue}
                        onChange={this.onFieldChange}
                        onCommentChange={this.onCommentChange}
                        label={this.getLabelForId(q.id)}
                        position={this.getPositionForId(q.id)}
                        instructions={
                          this.getValueForId(q.id, 'description')
                        }
                        placeholder={
                          this.getValueForId(q.id, 'placeholder')
                        }
                        config={
                          this.getValueForId(q.id, 'config')
                        }
                        context={this.props.context}>
          {this.getValueForId(q.id, 'text')}
        </ComponentClass>
      );
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
