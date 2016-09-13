import React from 'react'; // eslint-disable-line no-unused-vars
import {render} from 'react-dom';
import QuestionForm from './QuestionForm.jsx';
import $ from 'jquery';

let qsSchema = window.qsSchema;
let questions = window.questions;

$(function() {
  // Reload page with Dataset QuestionSet if dataset is changed.
  $('#dataset-select, #place-select').change(function(e) {
    e.preventDefault();
    let form = $(this).parents('form:first');
    form.submit();
  });
});

// Main QuestionSet, section B.
render(<QuestionForm questions={questions}
                     qsSchema={qsSchema}
                     labelPrefix={'B'} />,
       document.getElementById('questions'));
