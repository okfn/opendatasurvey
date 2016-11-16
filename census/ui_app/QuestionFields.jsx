import React from 'react';
import _ from 'lodash';
import * as helpers from './HelperFields.jsx';

// A base Higher-Order Component providing common behaviour for all Question
// Fields.
const baseQuestionField = QuestionField => {
  const BaseQuestionField = React.createClass({
    propTypes: {
      visibleProps: React.PropTypes.object.isRequired,
      value: React.PropTypes.oneOfType([
        React.PropTypes.string,
        React.PropTypes.number,
        React.PropTypes.object,
        React.PropTypes.array
      ]).isRequired,
      commentValue: React.PropTypes.string,
      currentValue: React.PropTypes.oneOfType([
        React.PropTypes.string,
        React.PropTypes.number,
        React.PropTypes.object,
        React.PropTypes.array
      ]),
      labal: React.PropTypes.string,
      position: React.PropTypes.number.isRequired,
      instructions: React.PropTypes.string,
      placeholder: React.PropTypes.string,
      config: React.PropTypes.object,
      context: React.PropTypes.object,
      readonly: React.PropTypes.bool
    },

    _isSub() {
      /* Return a boolean to determine if the question should be considered a 'sub-
         question', based on the value of `position`.

        e.g.
        `1` would return False
        `1.1` would return True
      */
      return (this.props.position % 1 !== 0);
    },

    getClassValues() {
      var classValue = '';
      if (!this.props.visibleProps.enabled) classValue += 'disabled ';
      if (!this.props.visibleProps.visible) classValue += 'hide ';
      if (this.props.visibleProps.required) classValue += 'required ';
      if (this.props.position === 1) classValue += 'first ';
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
    let readOnlyOpts = {};
    if (this.props.readonly) readOnlyOpts.readOnly = 'readonly';
    return (<div className={'text question ' + this.props.getClassValues()}>
      <div className="main">
        <div>
          <helpers.QuestionInstructions instructionText={this.props.instructions}
                                        id={this.props.id} />
          <helpers.QuestionHeader label={this.props.label}>
            {this.props.children.toString()}
          </helpers.QuestionHeader>
        </div>
        <div>
          <helpers.CurrentEntry currentValue={this.props.currentValue} />
          <div className="answer-wrapper">
            <div className="answer">
              <input type="text"
                     value={this.props.value}
                     name={this.props.id}
                     onChange={this.handler}
                     disabled={!this.props.visibleProps.enabled}
                     {...readOnlyOpts} />
            </div>
          </div>
        </div>
      </div>
      <helpers.QuestionComments id={this.props.id}
                                placeholder={this.props.placeholder}
                                commentValue={this.props.commentValue}
                                onCommentChange={this.props.onCommentChange}
                                disabled={!this.props.visibleProps.enabled}
                                readonly={this.props.readonly} />
    </div>);
  },

  handler(e) {
    this.props.onChange(this, e.target.value);
  }
});
QuestionFieldText = baseQuestionField(QuestionFieldText);

let QuestionFieldYesNo = React.createClass({
  render() {
    let readOnlyOpts = {};
    if (this.props.readonly) readOnlyOpts.readOnly = 'readonly';
    return (<div className={'yes-no question ' + this.props.getClassValues()}>
      <div className="main">
        <div>
          <helpers.QuestionInstructions instructionText={this.props.instructions}
                                        id={this.props.id} />
          <helpers.QuestionHeader label={this.props.label}>
            {this.props.children.toString()}
          </helpers.QuestionHeader>
        </div>
        <div>
          <helpers.CurrentEntry currentValue={this.props.currentValue} />
          <div className="answer-wrapper">
            <div className="answer">
              <input type="radio"
                     name={this.props.id}
                     id={this.props.id + '1'}
                     value="No"
                     checked={(this.props.value === 'No')}
                     disabled={!this.props.visibleProps.enabled}
                     onChange={this.handler}
                     {...readOnlyOpts} />
              <label htmlFor={this.props.id + '1'}>
                <span>No</span>
              </label>
              <input type="radio"
                     name={this.props.id}
                     id={this.props.id + '2'}
                     value="Yes"
                     checked={(this.props.value === 'Yes')}
                     disabled={!this.props.visibleProps.enabled}
                     onChange={this.handler}
                     {...readOnlyOpts} />
              <label htmlFor={this.props.id + '2'}>
                <span>Yes</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      <helpers.QuestionComments id={this.props.id}
                                placeholder={this.props.placeholder}
                                commentValue={this.props.commentValue}
                                onCommentChange={this.props.onCommentChange}
                                disabled={!this.props.visibleProps.enabled}
                                readonly={this.props.readonly} />
    </div>);
  },

  handler(e) {
    if (!this.props.readonly) {
      this.props.onChange(this, e.target.value);
    }
  }
});
QuestionFieldYesNo = baseQuestionField(QuestionFieldYesNo);

const QuestionFieldLikertOption = props => {
  let readOnlyOpts = {};
  if (props.readonly) readOnlyOpts.readOnly = 'readonly';
  return (
    <span>
      <input type="radio"
             name={props.id}
             id={props.id + props.value}
             value={props.value}
             onChange={props.handler}
             checked={props.checked}
             disabled={props.disabled}
             {...readOnlyOpts} />
      <label htmlFor={props.id + props.value}>
        <span>{props.value}</span> <em className="description">{props.description}</em>
      </label>
    </span>
  );
};

let QuestionFieldLikert = React.createClass({
  render() {
    let options = _.get(this.props.config, 'options', []);
    let scaleOptionNodes = _.map(options, option => {
      return <QuestionFieldLikertOption id={this.props.id}
                                        value={option.value}
                                        description={option.description}
                                        key={this.props.id + option.value}
                                        handler={this.handler}
                                        checked={this.props.value === option.value}
                                        disabled={!this.props.visibleProps.enabled}
                                        readonly={this.props.readonly} />;
    });
    return (<div className={'scale question ' + this.props.getClassValues()}>
      <div className="main">
        <div>
          <helpers.QuestionInstructions instructionText={this.props.instructions}
                                        id={this.props.id} />
          <helpers.QuestionHeader label={this.props.label}>
            {this.props.children.toString()}
          </helpers.QuestionHeader>
        </div>
        <div>
          <helpers.CurrentEntry currentValue={this.props.currentValue} />
          <div className="answer-wrapper">
            <div className="answer">
              {scaleOptionNodes}
            </div>
          </div>
        </div>
      </div>
      <helpers.QuestionComments id={this.props.id}
                                placeholder={this.props.placeholder}
                                commentValue={this.props.commentValue}
                                onCommentChange={this.props.onCommentChange}
                                disabled={!this.props.visibleProps.enabled}
                                readonly={this.props.readonly} />
    </div>);
  },

  handler(e) {
    if (!this.props.readonly) {
      this.props.onChange(this, e.target.value);
    }
  }
});
QuestionFieldLikert = baseQuestionField(QuestionFieldLikert);

const QuestionFieldSourceLine = props => {
  let commonOpts = {
    onChange: props.onChange,
    disabled: props.disabled
  };
  if (props.readonly) commonOpts.readOnly = 'readonly';
  return (
    <ul>
      <li>
        <label htmlFor={props.id + '_url'}>Source URL</label>
        <input id={props.id + '_url'}
               name={props.id + '_url'}
               type="url"
               data-key={'urlValue'}
               placeholder="http://"
               value={props.urlValue}
               {...commonOpts} />
      </li>
      <li>
        <label htmlFor={props.id + '_desc'}>Source description</label>
        <input id={props.id + '_desc'}
               name={props.id + '_desc'}
               type="text"
               data-key={'descValue'}
               value={props.descValue}
               {...commonOpts} />
      </li>
    </ul>
  );
};

let QuestionFieldSource = React.createClass({
  emptySource: {urlValue: '', descValue: ''},

  _getSourceValues() {
    let sourceValues = (_.isArray(this.props.value)) ? this.props.value : [];
    if (!_.isEqual(_.last(sourceValues), this.emptySource))
      sourceValues.push(_.clone(this.emptySource));
    return sourceValues;
  },

  componentWillMount() {
    // Split the current value object up into a list for display by
    // helpers.CurrentEntry.
    this.currentValue = _.filter(this.props.currentValue, val =>
      (val.urlValue || val.descValue));
    this.currentValue = _.map(this.currentValue, (val, i) =>
      <ul key={i}><li>{val.urlValue}</li><li>{val.descValue}</li></ul>);
  },

  render() {
    let sourceLines = [];
    let sourceValues = this._getSourceValues();
    for (var i = 0; i < sourceValues.length; i++) {
      let sourceValue = sourceValues[i];
      let node = <QuestionFieldSourceLine key={this.props.id + i}
                                          id={this.props.id + i}
                                          urlValue={sourceValue.urlValue}
                                          descValue={sourceValue.descValue}
                                          onChange={this.handler.bind(this, i)}
                                          disabled={!this.props.visibleProps.enabled}
                                          readonly={this.props.readonly}
                                           />;
      sourceLines.push(node);
    }
    return (<div className={'source question ' + this.props.getClassValues()}>
      <div className="main">
        <div>
          <helpers.QuestionInstructions instructionText={this.props.instructions}
                                        id={this.props.id} />
          <helpers.QuestionHeader label={this.props.label}>
            {this.props.children.toString()}
          </helpers.QuestionHeader>
        </div>
        <div>
          <helpers.CurrentEntry currentValue={this.currentValue} />
          <div className="answer-wrapper">
            <div className="answer">
              {sourceLines}
            </div>
          </div>
        </div>
      </div>
      <helpers.QuestionComments id={this.props.id}
                        placeholder={this.props.placeholder}
                        commentValue={this.props.commentValue}
                        onCommentChange={this.props.onCommentChange}
                        disabled={!this.props.visibleProps.enabled}
                        disabled={!this.props.visibleProps.enabled}
                        readonly={this.props.readonly} />
    </div>);
  },

  handler(i, e) {
    let newSourceValues = this._getSourceValues();
    newSourceValues[i] = _.assign(newSourceValues[i],
                                  {[e.target.dataset.key]: e.target.value});
    newSourceValues = _.reject(newSourceValues, this.emptySource);
    this.props.onChange(this, newSourceValues);
  }
});
QuestionFieldSource = baseQuestionField(QuestionFieldSource);

const QuestionFieldMultipleChoiceOption = props => {
  let readOnlyOpts = {};
  if (props.readonly) readOnlyOpts.readOnly = 'readonly';
  return (
    <li>
      <input type="checkbox"
             name={props.id}
             id={props.id}
             value="1"
             checked={props.checked}
             onChange={props.handler}
             disabled={props.disabled}
             {...readOnlyOpts} />
      <label htmlFor={props.id}>
        <span className="letter">{props.label}</span> <span className="description">{props.children.toString()}</span>
      </label>
    </li>
  );
};

const QuestionFieldMultipleChoiceOther = props => {
  if (props.includeOther) {
    let readOnlyOpts = {};
    if (props.readonly) readOnlyOpts.readOnly = 'readonly';
    return (
      <div className="other text sub">
        <h3>Other</h3>
        <div className="answer">
          <input name={props.id}
                 value={props.value}
                 type="text"
                 disabled={props.disabled}
                 {...readOnlyOpts} />
        </div>
      </div>
    );
  }
  return null;
};

let QuestionFieldMultipleChoice = React.createClass({
  getDefaultOptionValuesForOptionList(optionList) {
    return _.map(optionList, option => {
      return {description: option, checked: false};
    });
  },

  componentWillMount() {
    // Set the defaultOptions collection, either from a list of
    // `options` in the Question's config, or from the context using a key
    // defined in the Question's config (`optionsContextKey`).
    let defaultOptions = [];
    if (_.has(this.props.config, 'optionsContextKey')) {
      // Config directs to get the value from the context for the key set in
      // `optionsContextKey`.
      let contextOptions =
        this.props.context[this.props.config.optionsContextKey];
      defaultOptions =
        this.getDefaultOptionValuesForOptionList(contextOptions);
    }
    if (_.has(this.props.config, 'options')) {
      // Config has a list of options to use directly.
      defaultOptions =
        this.getDefaultOptionValuesForOptionList(this.props.config.options);
    }
    // Merge the defaultOptions with those from the value in props to
    // get the value store we'll use for the render.
    this.optionValues = _.assign(defaultOptions, this.props.value);
    this.orderOptions = _.get(this.props.config, 'orderOptions', false);
  },

  render() {
    if (this.orderOptions) {
      this.optionValues = _.sortBy(this.optionValues, 'description');
    }
    let choices = _.map(this.optionValues, (option, i) => {
      // i ==> letter, good for the first 26 options!
      let label = String.fromCharCode(97 + i).toUpperCase();
      return <QuestionFieldMultipleChoiceOption key={i}
                                                id={this.props.id + i}
                                                checked={option.checked}
                                                label={label}
                                                handler={this.handler.bind(this, i)}
                                                disabled={!this.props.visibleProps.enabled}
                                                readonly={this.props.readonly}>
                {option.description}
              </QuestionFieldMultipleChoiceOption>;
    });
    let currentValue = _.filter(this.props.currentValue, option => option.checked);
    currentValue = _.map(currentValue, option => option.description);
    if (this.orderOptions) currentValue = _.sortBy(currentValue);
    return (<div className={'multiple question ' + this.props.getClassValues()}>
      <div className="main">
        <div>
          <helpers.QuestionInstructions instructionText={this.props.instructions}
                                        id={this.props.id} />
          <helpers.QuestionHeader label={this.props.label}>
            {this.props.children.toString()}
          </helpers.QuestionHeader>
        </div>
        <div>
          <helpers.CurrentEntry currentValue={currentValue} />
          <div className="answer-wrapper">
            <div className={this._getAnswerClassNames()}>
              <ul>
                {choices}
              </ul>
            </div>
            <QuestionFieldMultipleChoiceOther includeOther={this.props.config.includeOther}
                                              id={this.props.id + '_other'}
                                              disabled={!this.props.visibleProps.enabled}
                                              readonly={this.props.readonly} />
          </div>
        </div>
      </div>
      <helpers.QuestionComments id={this.props.id}
                                placeholder={this.props.placeholder}
                                commentValue={this.props.commentValue}
                                onCommentChange={this.props.onCommentChange}
                                disabled={!this.props.visibleProps.enabled}
                                readonly={this.props.readonly} />
    </div>);
  },

  _getAnswerClassNames() {
    let classNames = 'answer';
    if (_.get(this.props.config, 'short', false)) {
      classNames += ' short';
    }
    return classNames;
  },

  handler(i, e) {
    if (!this.props.readonly) {
      let newOptionValues = this.optionValues;
      newOptionValues[i].checked = e.target.checked;
      this.props.onChange(this, newOptionValues);
    }
  }
});
QuestionFieldMultipleChoice = baseQuestionField(QuestionFieldMultipleChoice);

export {
  QuestionFieldText,
  QuestionFieldYesNo,
  QuestionFieldLikert,
  QuestionFieldSource,
  QuestionFieldMultipleChoice
};
