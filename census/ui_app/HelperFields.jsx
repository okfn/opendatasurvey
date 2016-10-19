import React from 'react';

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

const QuestionComments = React.createClass({
  render() {
    return (<div className="comments">
      <label htmlFor={this.props.id + '_comment'}>Comments</label>
      <textarea placeholder={this.props.placeholder || 'Add comments' }
                id={this.props.id + '_comment'}
                rows="5"
                name={this.props.id + '_comment'}
                value={this.props.commentValue}
                onChange={this.handler}></textarea>
    </div>);
  },

  handler(e) {
    this.props.onCommentChange(this, e.target.value);
  }
});

const QuestionHeader = props => {
  return (
    <h2>
      <span>{props.label}</span> {props.children.toString()}
    </h2>
  );
};

export {
  QuestionInstructions,
  QuestionComments,
  QuestionHeader
};
