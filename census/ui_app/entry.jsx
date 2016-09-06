import React from 'react';
import {render} from 'react-dom';
import QuestionForm from './QuestionForm.jsx';

let qsSchema = window.qsSchema;
let questions = window.questions;

// Add preliminary QuestionSet here, section A.

// Main QuestionSet, section B.
render(<QuestionForm questions={questions} qsSchema={qsSchema} labelPrefix={'B'} />,
       document.getElementById('questions'));
