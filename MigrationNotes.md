# Notes on migrating from census-2015 to census-2016 codebase

## Changes to the CMS (Google Spreadsheets)

In the old codebase, Questions were associated with Datasets at the site level, i.e. one set of Questions was used for all Datasets. This is no longer a restriction. Questions are grouped in QuestionSets, and each site can configure one QuestionSet for use by all of the site's Datasets, or a QuestionSet can be defined for each Dataset individually.

In the CMS, the Datasets sheet has a new `QuestionSetURL` column. The value is the url pointing to the `QuestionSet` config sheet. A site-wide Question Set url can be added to the site config page under the key `question_set_url`. A further system-wide fallback Question Set url can be set as an env var, `FALLBACK_QUESTIONSET` (this is provided for backward-compatibility to smooth migration to the new system).

Datasets also have a new `UpdateEvery` column. The value for each cell in this column should be a time interval as a string in the question: "Data should be updated every {{ time interval }}." E.g. year, month, 6 months, day, second Thursday, etc. 

The new Question Set config sheet is like the `Site` config. It has `key` and `value` columns. It expects a `questions` key, the value is the url the questions sheet, and a `question_set_schema` key, the value is the question set schema in json format (see the [Question Set Schema](#question-set-schema-json-format) section below).

### Extra Question Config

Some question types require extra configuration. For example, the `likert` question type has configuration to define the number of options, and description and value for each option. This will be used to setup the survey form. There is a column called 'Config' in the spreadsheet where a small snippet of json can be added. Below are example configurations for question types that require it:

#### Likert config

```json
[
    {"description": "None", "value": "0"},
    {"description": "Some", "value": "1"},
    {"description": "All", "value": "2"}
]
```

## Changes to the database

Once loaded into the database, each `Dataset` has a foreignKey to the `QuestionSet` it uses. `Questions` now have a foreignKey to the parent `QuestionSet` (`Question.questionsetid`). `Questions` have altered their primaryKey to be (id, questionsetid). The `QuestionSet.id` primaryKey is a hash of the `site` + `qsurl`. This ensures that sites using a Question Set located at the same url will load into the database as distinct `QuestionSet` instances.

## Question Set Schema json format

A question set schema provides the structure and dependency graph for a set of `Questions`.

This decouples `Question` objects from information about the relationships and hierarchy between `Questions`, leaving `Questions` as stand-alone as possible.

Here is a question set schema for this example set of questions:

1. Do you like apples?
    - 1.2. Do you like bananas instead? (shown when 1 is 'No')
2. Do you like RED apples? (enabled if 1 is 'Yes')   
3. Have you eaten a red apple today? (enabled if 2 is 'Yes')
    - 3.1. Did it keep the doctor away? (shown when 3 is 'Yes')

```javascript

[
    {
        // The question is "Do you like apples?"
        "id": "like_apples",
        "position": 1,
        "defaultProperties": {
            "visible": true,
            "enabled": true,
            "required": true
        }
    },
    {
        // The question is "Do you like bananas instead?"
        "id": "bananas_instead",
        "position": 1.1,
        "defaultProperties": {
            "visible": false,
            "enabled": false,
            "required": false
        },
        "if": [
            {
                "providerId": "like_apples",
                "value": "No",
                "properties": {
                    "visible": true,
                    "enabled": true,
                    "required": true
                }
            }
        ]
    },
    {
        // The question is "Do you like RED apples?"
        "id": "apple_colour",
        "position": 2,
        "defaultProperties": {
            "visible": true,
            "enabled": false,
            "required": false
        },
        "if": [
            {
                "providerId": "like_apples",
                "value": "Yes",
                "properties": {
                    "enabled": true,
                    "required": true
                } 
            }
        ] 
    },    
    {
        // The question is "Have you eaten a red apple today?"
        "id": "red_apple_today",
        "position": 3,
        "defaultProperties": {
            "visible": true,
            "enabled": false,
            "required": false
        },
        "if": [
            {
                "providerId": "apple_colour",
                "value": "Yes",
                "properties": {
                    "enabled": true,
                    "required": true
                }
            }
        ]
    },
    {
        // The question is "Did it keep the doctor away? (optional)"
        "id": "doctor_away",
        "position": 3.1,
        "defaultProperties": {
            "visible": false,
            "enabled": false,
            "required": false
        },
        "if": [
            {
                "providerId": "red_apple_today",
                "value": "Yes",
                "properties": {
                    "visible": true,
                    "enabled": true
                }
            }
        ]
    }
]
```



### Question Set Schema, JSON Schema

The schema above must validate against the following JSON Schema:

```javascript
{
    "$schema": "http://json-schema.org/draft-04/schema#",

    "definitions": {
        "question": {
            "title": "Question",
            "description": "Determines the default and dependent properties for a Question.",
            "type": "object",
            "properties": {
                "id": {
                    "description": "The unique identifier for a question within a question set.",
                    "type": "string"
                },
                "position": {
                    "description": "The hierarchical position of the question within",
                    "type": "number"
                },
                "defaultProperties": {
                    "description": "An object containing the default properties for the visible state of the Question if no subsequent conditions are met.",
                    "type": "object",
                    "properties": {
                        "required": {"type": "boolean"},
                        "enabled": {"type": "boolean"},
                        "visible": {"type": "boolean"}
                    }
                },
                "if": {
                    "description": "An array of objects containing conditional logic to determine the state of Question properties dependent on the value of other Questions in the Question Set. First matching member takes presidents.",
                    "type": "array",
                    "items": {
                        "properties": {
                            "providerId": {
                                "description": "The ID of the Question on which this Question depends.",
                                "type": "string"
                            },
                            "value": {
                                "description": "The expected value that will trigger this condition.",
                                "type": ["string", "boolean", "number"]
                            },
                            "properties": {
                                "description": "The properties to set if the Question with dependentId returns the value.",
                                "type": "object",
                                "properties": {
                                    "required": {"type": "boolean"},
                                    "enabled": {"type": "boolean"},
                                    "visible": {"type": "boolean"}
                                }
                            }
                        },
                        "required": ["providerId", "value", "properties"]
                    }
                }
            },
            "required": ["id"]            
        }
    },

    "title": "QuestionSet",
    "description": "A set of Question objects.",
    "type": "array",
    "items": {"$ref": "#/definitions/question"}   
}
```

Schema validity can be checked with online services, such as http://www.jsonschemavalidator.net/. And Question Set Schemas can be built with http://jeremydorn.com/json-editor/

## Templates and Front-end dependencies

The old templates directory has been renamed `views_old`. New templates have been moved to `views`. Both directories are referencec by the app as places where templates can be located, with the intension of eventually removing `views_old` completely once migration is complete.

Static assets have been moved from `public` to `static`.

There are some small differences between the Global Index and Local site templates. This is managed by the `is_index` flag on the Global Config settings. Local sites do not need to include this setting.
