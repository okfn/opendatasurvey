import React from 'react';
import {render} from 'react-dom';
import QuestionForm from './QuestionForm.jsx';

let qsSchema = window.qsSchema;
let questions = window.questions;

render(<QuestionForm questions={questions} qsSchema={qsSchema} />,
       document.getElementById('questions'));
