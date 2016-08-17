import React from 'react';
import {render} from 'react-dom';
import QuestionForm from './QuestionForm.jsx';

// eslint-disable-next-line
let questions = [{'id':'like_apples','text':'Do you like apples?','type':''},{'id':'bananas_instead','text':'Do you like bananas instead?','type':''},{'id':'apple_colour','text':'Do you like *RED* apples?','type':''},{'id':'red_apple_today','text':'Have you eaten a red apple today?','type':''},{'id':'doctor_away','text':'Did it keep the doctor away?','type':''}];
// eslint-disable-next-line
let qsSchema = [{'defaultProperties':{'enabled':true,'required':true,'visible':true},'id':'like_apples','position':1},{'defaultProperties':{'enabled':false,'required':false,'visible':false},'id':'bananas_instead','if':[{'dependentId':'like_apples','properties':{'enabled':true,'required':true,'visible':true},'value':'No'}],'position':1.1},{'defaultProperties':{'enabled':false,'required':false,'visible':true},'id':'apple_colour','if':[{'dependentId':'like_apples','properties':{'enabled':true,'required':true},'value':'Yes'}],'position':2},{'defaultProperties':{'enabled':false,'required':false,'visible':true},'id':'red_apple_today','if':[{'dependentId':'apple_colour','properties':{'enabled':true,'required':true},'value':'Yes'}],'position':3},{'defaultProperties':{'enabled':false,'required':false,'visible':false},'id':'doctor_away','if':[{'dependentId':'red_apple_today','properties':{'enabled':true,'visible':true},'value':'Yes'}],'position':3.1}];

render(<QuestionForm questions={questions} qsSchema={qsSchema} />,
       document.getElementById('questions'));
