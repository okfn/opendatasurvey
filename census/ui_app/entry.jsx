import React from 'react'; // eslint-disable-line no-unused-vars
import {render} from 'react-dom';
import EntryForm from './EntryForm.jsx';
import $ from 'jquery';

let qsSchema = window.qsSchema;
let questions = window.questions;
let datasetContext = window.datasetContext;
let answers = window.formData;
let isReview = window.isReview;

$(function() {
  // Reload page with Dataset QuestionSet if dataset is changed.
  $('#dataset-select').change(function(e) {
    e.preventDefault();
    let form = $(this).parents('form:first');
    form.submit();
  });
});

// Main QuestionSet, section B.
render(<EntryForm questions={questions}
                  qsSchema={qsSchema}
                  context={datasetContext}
                  answers={answers}
                  place={answers.place}
                  dataset={answers.dataset}
                  isReview={isReview} />,
       document.getElementById('entry_form'));
