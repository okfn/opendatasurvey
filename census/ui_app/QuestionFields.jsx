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

const QuestionHeader = React.createClass({
  render() {
    return (<h2>
      <span>{this.props.label}</span> {this.props.children.toString()}
    </h2>);
  }
});

// A base Higher-Order Component providing common behaviour for all Question
// Fields.
const baseQuestionField = function(QuestionField) {
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

const QuestionFieldLikertOption = React.createClass({
  render() {
    return (
      <span>
        <input type="radio" name={this.props.id}
                            id={this.props.id + this.props.value}
                            value={this.props.value} />
        <label htmlFor={this.props.id + this.props.value}>
          <span>{this.props.value}</span> <em className="description">{this.props.description}</em>
        </label>
      </span>
    );
  }
});

let QuestionFieldLikert = React.createClass({
  render() {
    let scaleOptionNodes = _.map(this.props.config, option => {
      return <QuestionFieldLikertOption id={this.props.id}
                                        value={option.value}
                                        description={option.description}
                                        key={this.props.id + option.value} />;
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

module.exports = {
  QuestionFieldText: QuestionFieldText,
  QuestionFieldYesNo: QuestionFieldYesNo,
  QuestionFieldLikert: QuestionFieldLikert
};
