import React from 'react'; // eslint-disable-line no-unused-vars
import {render} from 'react-dom';
import EntryForm from './EntryForm.jsx';

let qsSchema = window.qsSchema;
let questions = window.questions;
let datasetContext = window.datasetContext;
let answers = window.formData;
let isReview = window.isReview;
let canReview = window.canReview || false;
let submissionDiscussionURL = window.submissionDiscussionURL;

// Main QuestionSet, section B.
render(<EntryForm questions={questions}
                  qsSchema={qsSchema}
                  context={datasetContext}
                  answers={answers}
                  place={answers.place}
                  dataset={answers.dataset}
                  isReview={isReview}
                  canReview={canReview}
                  submissionDiscussionURL={submissionDiscussionURL} />,
       document.getElementById('entry_form'));
