import React from 'react';
import _ from 'lodash';

const QuestionInstructions = props => {
  if (props.instructionText) {
    return (
      <div className="instructions">
        <div className="collapse" id={'instructions' + props.id}>
          <h4>Instructions</h4>
          <span dangerouslySetInnerHTML={{__html: props.instructionText}} />
        </div>
        <a className="toggle"
           role="button"
           data-toggle="collapse"
           href={'#instructions' + props.id}
           aria-expanded="false"
           aria-controls={'instructions' + props.id}>
            <span className="sr-only">Help</span><span className="icon">?</span>
        </a>
      </div>
    );
  }
  return (<div className="instructions"></div>);
};

const QuestionComments = props => {
  return (
    <div className="comments">
      <label htmlFor={props.id + '_comment'}>Comments</label>
      <textarea placeholder={props.placeholder || 'Add comments' }
                id={props.id + '_comment'}
                rows="5"></textarea>
    </div>
  );
};

const QuestionHeader = props => {
  return (
    <h2>
      <span>{props.label}</span> {props.children.toString()}
    </h2>
  );
};

// A base Higher-Order Component providing common behaviour for all Question
// Fields.
const baseQuestionField = QuestionField => {
  const BaseQuestionField = React.createClass({
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
        <QuestionHeader label={this.props.label}>
          {this.props.children.toString()}
        </QuestionHeader>
        <div className="answer">
          <input type="text" value={this.props.value} onChange={this.handler} />
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
        <QuestionHeader label={this.props.label}>
          {this.props.children.toString()}
        </QuestionHeader>
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

const QuestionFieldLikertOption = props => {
  return (
    <span>
      <input type="radio" name={props.id}
                          id={props.id + props.value}
                          value={props.value}
                          onChange={props.handler}
                          checked={props.checked} />
      <label htmlFor={props.id + props.value}>
        <span>{props.value}</span> <em className="description">{props.description}</em>
      </label>
    </span>
  );
};

let QuestionFieldLikert = React.createClass({
  render() {
    let scaleOptionNodes = _.map(this.props.config, option => {
      return <QuestionFieldLikertOption id={this.props.id}
                                        value={option.value}
                                        description={option.description}
                                        key={this.props.id + option.value}
                                        handler={this.handler}
                                        checked={this.props.value === option.value} />;
    });
    return (<div className={'scale question ' + this.props.getClassValues()}>
      <QuestionInstructions instructionText={this.props.instructions}
                            id={this.props.id} />
      <div className="main">
        <QuestionHeader label={this.props.label}>
          {this.props.children.toString()}
        </QuestionHeader>
        <div className="answer">
          {scaleOptionNodes}
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
QuestionFieldLikert = baseQuestionField(QuestionFieldLikert);

const QuestionFieldSourceLine = props => {
  return (
    <ul onChange={props.handler}>
      <li>
        <label htmlFor={props.id + '_url'}>Source URL</label>
        <input id={props.id + '_url'}
               name={props.id + '_url'}
               type="url"
               data-key={'urlValue'}
               placeholder="http://"
               value={props.urlValue} />
      </li>
      <li>
        <label htmlFor={props.id + '_desc'}>Source description</label>
        <input id={props.id + '_desc'}
               name={props.id + '_desc'}
               type="text"
               data-key={'descValue'}
               value={props.descValue} />
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

  render() {
    let sourceLines = [];
    let sourceValues = this._getSourceValues();
    for (var i = 0; i < sourceValues.length; i++) {
      let sourceValue = sourceValues[i];
      let node = <QuestionFieldSourceLine key={this.props.id + i}
                                          id={this.props.id + i}
                                          urlValue={sourceValue.urlValue}
                                          descValue={sourceValue.descValue}
                                          handler={this.handler.bind(this, i)} />;
      sourceLines.push(node);
    }
    return (<div className={'source question ' + this.props.getClassValues()}>
      <QuestionInstructions instructionText={this.props.instructions}
                            id={this.props.id} />
      <div className="main">
        <QuestionHeader label={this.props.label}>
          {this.props.children.toString()}
        </QuestionHeader>
        <div className="answer">
          {sourceLines}
        </div>
      </div>
      <QuestionComments id={this.props.id}
                        placeholder={this.props.placeholder} />
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
  return (
    <li>
      <input type="checkbox"
             name={props.id}
             id={props.id}
             value="1"
             checked={props.checked}
             onChange={props.handler} />
      <label htmlFor={props.id}>
        <span className="letter">{props.label}</span> <span className="description">{props.children.toString()}</span>
      </label>
    </li>
  );
};

let QuestionFieldMultipleChoice = React.createClass({
  getDefaultOptionsForCharacteristics(characteristics) {
    return _.map(characteristics, char => {
      return {description: char, checked: false};
    });
  },

  componentWillMount() {
    // Set the defaultCharacteristics collection, either from a list of
    // `options` in the Question's config, or from the context using a key
    // defined in the Question's config (`optionsContextKey`).
    let defaultCharacteristics = [];
    if (_.has(this.props.config, 'optionsContextKey')) {
      // Config directs to get the value from the context for the key set in
      // `optionsContextKey`.
      let contextCharacteristics =
        this.props.context[this.props.config.optionsContextKey];
      defaultCharacteristics =
        this.getDefaultOptionsForCharacteristics(contextCharacteristics);
    }
    if (_.has(this.props.config, 'options')) {
      // Config has a list of options to use directly.
      defaultCharacteristics =
        this.getDefaultOptionsForCharacteristics(this.props.config.options);
    }
    // Merge the defaultCharacteristics with those from the value in props to
    // get the value store we'll use for the render.
    this.optionValues = _.assign(defaultCharacteristics, this.props.value);
  },

  render() {
    let choices = _.map(this.optionValues, (option, i) => {
      // i ==> letter, good for the first 26 options!
      let label = String.fromCharCode(97 + i).toUpperCase();
      return <QuestionFieldMultipleChoiceOption key={i}
                                                id={this.props.id + i}
                                                checked={option.checked}
                                                label={label}
                                                handler={this.handler.bind(this, i)}>
                {option.description}
              </QuestionFieldMultipleChoiceOption>;
    });
    return (<div className={'multiple question ' + this.props.getClassValues()}>
      <QuestionInstructions instructionText={this.props.instructions}
                            id={this.props.id} />
      <div className="main">
        <QuestionHeader label={this.props.label}>
          {this.props.children.toString()}
        </QuestionHeader>
        <div className="answer">
          <ul>
            {choices}
          </ul>
        </div>
      </div>
      <QuestionComments id={this.props.id}
                        placeholder={this.props.placeholder} />
    </div>);
  },

  handler(i, e) {
    let newOptionValues = this.optionValues;
    newOptionValues[i].checked = e.target.checked;
    this.props.onChange(this, newOptionValues);
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
