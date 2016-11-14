import _ from 'lodash';
import React from 'react';

const CurrentEntry = props => {
  if (props.currentValue && props.currentValue.length) {
    let currentValue = (_.isArray(props.currentValue)) ?
      props.currentValue : [props.currentValue];
    let dds = _.map(currentValue, (cv, i) => <dd key={i}>{cv}</dd>);
    return (<div className="current">
      <dl>
        <dt>Current entry</dt>
        {dds}
      </dl>
    </div>);
  }
  return <div className="current" />;
};

const SubmitActions = props => {
  if (props.isReview && props.canReview) {
    return (<div>
    <div className="text question">
      <div className="main">
        <div>
          <div className="instructions"></div>
          <h2>Please add a short comment as to why you are accepting or rejecting this submission. <strong>Note that your message will be publically visible</strong></h2>
        </div>
        <div>
          <CurrentEntry />
          <div className="answer-wrapper">
            <div className="answer">
              <textarea name="reviewComments" rows="5" defaultValue={props.reviewComments}></textarea>
            </div>
          </div>
        </div>
      </div>
      <div className="comments"></div>
    </div>
    <div className="submit continuation question">
      <div className="main">
        <div>
          <div className="instructions"></div>
          <h4>Important</h4>
          <p>As the reviewer, your name will be logged and displayed with the entry.</p>
          <p>
            If necessary, edit the submission before accepting it. In particular, please correct any spelling mistakes.
          </p>
          <p>
            <span className="label label-info">Publish</span> will overwite the whole entry with the data in this form.
          </p>
        </div>
        <div>
          <CurrentEntry />
          <div className="answer-wrapper">
            <div className="answer">
              <form method="post" acceptCharset="utf-8" onSubmit={props.onSubmitHandler}>
                <button type="submit" value="publish" name="reviewAction">Publish</button>
              </form>
              <form method="post" acceptCharset="utf-8" onSubmit={props.onSubmitHandler}>
                <button type="submit" value="reject" name="reviewAction" className="reject">Reject</button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div className="comments"></div>
    </div>
    </div>);
  } else if (props.isReview && !props.canReview) {
    return null;
  } else {
    return (<div className="submit continuation question">
      <div className="main">
        <div>
          <div className="instructions"></div>
          <p><small>By submitting material to the index you agreeing to <a href="http://okfn.org/terms-of-use/">terms of use</a> and also to license your contribution (to the extent there are any rights in it!) under the <a href="http://opendatacommons.org/licenses/pddl/1.0/">Open Data Commons Public Domain Dedication and License</a>.</small></p>
        </div>
        <div>
          <CurrentEntry />
          <div className="answer-wrapper">
            <div className="answer">
              <form method="post" acceptCharset="utf-8" onSubmit={props.onSubmitHandler}>
                <button type="submit">Submit</button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div className="comments"></div>
    </div>);
  }
};

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
    let readOnlyOpts = {};
    if (this.props.readonly) readOnlyOpts.readOnly = 'readonly';
    return (<div className="comments">
      <label htmlFor={this.props.id + '_comment'}>Comments</label>
      <textarea placeholder={this.props.placeholder || 'Add comments' }
                id={this.props.id + '_comment'}
                rows="5"
                name={this.props.id + '_comment'}
                value={this.props.commentValue}
                onChange={this.handler}
                disabled={this.props.disabled}
                {...readOnlyOpts}></textarea>
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
  QuestionHeader,
  SubmitActions,
  CurrentEntry
};
