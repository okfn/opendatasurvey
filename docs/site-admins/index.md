# Site Admin Documentation

This is a short introduction on how to administer an Open Data Survey.

Note: it assumes that a survey instance has been booted for you (and is __not__ about the technical side of deploying a survey instance)

## Table of contents

[TOC]

## Overview of How a Survey is Structured

A Census is a survey built around 4 axes:

 * Place – e.g. a country, a city or a region
 * Dataset – e.g. Budget
 * Question – a specific question we ask about each dataset (e.g. "does it exist", "is it machine readable")
 * Time – usually a year

We then ask of each Place / Dataset / Time combination for an answer to the set of "Questions".

The set of answers to the Questions for given Place / Dataset / Time combination is called a `Submission`.

When a `Submission` has been reviewed and deemed accurate it becomes an `Entry` in the Census.

### Workflow

#### New submissions

 * Contributors visit the `/submit/` page to make a new `Submission`
 * Contributors can also click on the `+` icon of a dataset
 
 ![census-submit](/files/survey-add.png)
 
 * This `Submission` is now queued awaiting review by a reviewer (see next item for details on what that means). You can see a submission is waiting for review because the `+`sign becomes a `1`, and the number also appears on the top right corner of the icon. 

 ![census-submit](/files/survey-rev.png)


##### Note
 
   * The `approve_first_submission` config variable can be set to TRUE in order to approve the first submission for a place/dataset/year automatically, without review.
   * **Reviewers can be set in three places:** 
   	* In the **config sheet**, where the reviewers can review all data for the instance
   	* In the **datasets sheet**, where the reviewers can review all data for a particular dataset
   	* In the **places sheet**, where the reviewers can review all data for a particular place

#### Reviewing a submission

 * A reviewer visits the place page for a given place (e.g. `/place/gb`) – normally they will do this via the front page
 * A reviewer clicks on the "View Submission" button next to a pending submission:

   ![census-submit](/files/survey-rev.png)

 * A reviewer visits the review page for a submission
 * The reviewer reviews or rejects the submission
 * If approved the submission will now become the "entry" for that place and show up in the overview and elsewhere
 * If rejected the submission will be marked as rejected and will no longer show up

###### Note
 
 * You must be an authorized reviewer to review (see `reviewers` config option below)
 * You must be logged in to review

## Configuration

Each Survey **site** is configured via Google Spreadsheets. Each spreadsheet must be "public on the web" **and** "published to the web" (see Google Spreadsheets for details on how to ensure this).

We can divide the configuration required for a **site** into two types:

 * **'Site config'** – the fundamental configuration for a site, such as the title, plus links to the other config sheets required (e.g.: places, datasets and questions)
 * **'Survey config'** – the list of Places, Datasets and Questions to use for this census. The site config contains pointers to where to find these.

Both types of configuration should be stored in publicly accessible Google spreadsheets (one file for app config and one each for places, datasets and question sets).

Our recommended approach is to have all of these as separate sheets in one large google spreadsheet document that is made 'public on the web' (each sheet can then be accessed as a CSV file).

Here is a [Template General Config Spreadsheet][template-config].

The Site config options (the first sheet in that spreadsheet) are documented in the Appendix below. The changes you make to the speadsheet will have to be reloaded through the admin page. Remember to always do this after configuring your survey or modifying it in any way.

## How-tos

### Configure your Census

For the Census to work properly you need to do some initial basic configuration:

 * Add a list of places for the Census to cover – see [Setting up Places](#setting-up-places) below
 * Set a `title` value in your General Config as appropriate e.g. "US City Open Data Census"

Next steps:

 * If you want reviews to work you will need to configure a list of reviewers – see instructions below

####Extras – set additional content 

 * Add a logo – `navbar_logo` config variable
 * Some short text on the front page – 3-4 sentences about what this is – `overview_page` config variable
 * About page – `about_page` config variable
 * FAQ page – `faq_page` config variable

### Setting up Places

 * Add places to the Places sheet in your Config Spreadsheet
 * The id column should only have lowercase ASCII alphanumeric characters and '-'. For example:
    * OK: 'sanfrancisco' or 'san-francisco'
    * Not OK: 'san francisco' (space) or 'SanFrancisco' (uppercase) or 'München' (non-Ascii character)
 * The slug column should only have lowercase ASCII alphanumeric characters and '-'.
 * The Name column can have any characters you like (including non-ASCII)

__Remember to reload the config once you have finished to have your new list of Places show up in the app.__

### Setting up Reviewers

To give a user Reviewer 'privileges' you must add them to the reviewers config – see below.

### Reload the Config

Once the system administrator has added your new Site to the registry, and you have subsequently configured your Config, Places and Datasets sheets, you need to load your data in to the database.

<http://{your-census-id}.survey.okfn.org/admin>

__Remember to reload your config settings here anytime you make a change, so that it is reflected in the database.__

### Localization

This section describes how to have site content presented in languages other than English.

There are two types of material that can be localized:

 * General site content usually defined in the website templates and core code
 * 'Configurable' content such as question titles and descriptions, the names and descriptions of datasets, etc

To have your site presented in a given language you need to:

 * Make sure the relevant content is translated (if not already done, you'll need to do it) – instructions in next sections
 * Configure your Census site so that a particular language is shown – see the locales config option in the config options section below

#### Translating Questions (deprecated)

To translate the primary language:

 * Open the Questions tab of your Survey site spreadsheet
 * Translate the Question, QuestionShort, Description, Placeholder, and Config columns into the desired primary language
 * Reload QuestionSets from the site admin page: <http://{your-census-id}.survey.okfn.org/admin>

To add another, second language (partial support for multiple languages): 

 * Add a column Question@{LANG}, QuestionShort@{LANG}, Description@{LANG} where {LANG} is your 2 digit iso code (Config and Placeholder are not currently supported)
 * Enter translations of the values for Question and Description in your new columns
 * Reload QuestionSets from the site admin page: <http://{your-census-id}.survey.okfn.org/admin>

#### Translating Datasets

To translate the primary language:

 * Open the Datasets tab of your Survey site spreadsheet
 * Translate the Name, Description, UpdateEvery, and Characteristics: columns into the desired primary language
 * Reload Datasets from the site admin page: <http://{your-census-id}.survey.okfn.org/admin>

To add another, second language (partial support for multiple languages): 

 * Add a column Name@{LANG}, Description@{LANG}, and Characteristics:n@{LANG} (one for each Characteristic) to the Datasets sheet, where {LANG} is your 2 digit iso code (UpdateEvery is not currently supported)
 * Translate the original Name and Description into your secondary language and enter into the new columns you created
 * Reload Datasets from the site admin page: <http://{your-census-id}.survey.okfn.org/admin>

#### Translating General Site Content

 * Visit the [Open Data Census translation project on Transifex][transifex]
    * Create an account if you need one
 * Submit translations
 * Notify the Open Data Census Managers on the [discussion forum][discussion-forum] when the translation is complete.

__If you require access to the transifex project please let us know in the [discussion forum][discussion-forum]

### Customizing the List of Datasets

 * Go into your Config Spreadsheet and select the Datasets sheet
 * Fill out the Datasets sheet following the structure provided. You can ignore the Category column.
 * It is important to add reasonably detailed descriptions for the datasets so people are clear what they are looking for and how to answer.
 * We recommend not having more than ~ 15-17 datasets in your Census. Having more datasets might create issues with the Census UI. 
 * Ensure the URL value used in the General Config sheet for 'datasets' points to the Datasets sheet.
 * Reload the config

## General Config Options

These are the config variables you can set in the the "General Config" sheet of your config spreadsheet (a Google Spreadsheet or online CSV file).

Those marked with a (*) must be set.

### title

Site title – used on the website etc

### title_short

Short version of the title

### locales

Set list of language locales that should be available for your site. See [Localization](#localization) above for more details. Format is space separated 2-digit language codes. First language is the default for the site. For example, to have a site in German and English (German by default) set value to:

`de en`

### reviewers

List of reviewer emails separated by commas. Be aware that the emails need to be either a gmail account or the email that matches the facebook user the reviewer will use to login. 

### datasets

URL to a Google Spreadsheet (make sure url is to *actual* sheet you want) or online CSV file containing a list of datasets to ask questions about.

The structure should follow that in the [template spreadsheet][template-config].

### places

URL to a Google Spreadsheet (make sure url is to the *actual* sheet you want) or online CSV file containing a list of places to ask questions about.

The structure should follow that in the [template spreadsheet][template-config].

You can _optionally_ add a Reviewers column that accepts a comma separated list
of emails. These users will then have access to approve or reject revisions
submitted for datasets in that place.

### question_set_url

`question_set_url` must be a URL to a Google Spreadsheet (make sure url is to the *actual* sheet you want) or online CSV file containing a list of questions about.

The structure should follow that in the [template spreadsheet][template-config].

Questions are defined by a JSON in the `QuestionSet` sheet in the CMS. 

### approve_first_submission

Determines whether the first submission requires review by a reviewer.

Default is FALSE i.e. all submission must be reviewed.

### close_submissions

Defines if the survey will allow users to submit new information. 

Default is FALSE i.e. users can submit new data

### survey_year

Defines the year to be assessed. Will show a specific year of assessment.

### overview_page

Content for the overview on the home page (this is just content for top of page above results summary table).

You can use markdown or HTML format.

### submit_page

Instructions for the top of the submit page.

You can use markdown or HTML format.

### review_page

Instructions for the top of the review page.

You can use markdown or HTML format.

### faq_page

Content for the FAQ page.

You can use markdown or HTML format.

Note: you have access to 2 special variables that can be used in your html or markdown:

  * `{{ questions }}` - this will be replaced by a table of all the questions
  * `{{ datasets }}` - this will be replaced by a table of all the datasets

### about_page

Content for the about page.

You can use markdown or HTML format.

### contribute_page

Content for contribute page.

You can use markdown or HTML format.

### tutorial_page

Content for the tutorial page.

You can use markdown or HTML format.

### methodology_page

Content for the methodology page.

You can use markdown or HTML format.

### missing_place_html

Set to `true` to add an “Add new location” button to the overview, linking to `/faq#missing-place`.

Default is false

### navbar_logo

HTML for logo at top right of navbar

Here's some sample HTML (replace links and image with your own!):

```
<a href="http://okfn.org/" title="" target="_blank">
  <img src="//assets.okfn.org/images/logo/okfn-logo-landscape-black.png" alt="Logo" />
</a>
```

Logo will be scaled to 30px height (so best is if it is already 30px)

### custom_css

Custom CSS

### custom_footer

Custom footer content

### google_analytics_key

Supply a google analytics key to use on the site

### support_url

Custom support url linked from the top-level 'Support' navigation item. If
absent, the `discussionForum` global settings will be used instead.

### submission_discussion_url

A URL to a forum where users can discuss pending submissions. This URL will be linked from the bottom of the pending submission page. If the URL links to the discuss.okfn.org Discourse instance (in the format `http://discuss.okfn.org/c/<topic>/<subtopic>`), the link will be formatted to automatically create a new topic, pre-populated with a title, category, and body text linking back to the submission.

 ## Questions and Question Sets

Questions are loaded to the Survey through the `Questions` and `QuestionSet`sheets in the CMS. If you make changes to the `QuestionSet`values, make sure they validate against the JSON schema before reloading your survey. 

In the old Census, Questions were associated with Datasets at the site level, i.e. one set of Questions was used for all Datasets. This is no longer a restriction. Questions are grouped in QuestionSets, and each site can configure one QuestionSet for use by all of the site's Datasets, or a QuestionSet can be defined for each Dataset individually.

In the CMS, the Datasets sheet has a new `QuestionSetURL` column. The value is the url pointing to the `QuestionSet` config sheet. A site-wide Question Set url can be added to the site config page under the key `question_set_url`. A further system-wide fallback Question Set url can be set as an env var, `FALLBACK_QUESTIONSET` (this is provided for backward-compatibility to smooth migration to the new system).

Datasets also have a new `UpdateEvery` column. The value for each cell in this column should be a time interval as a string in the question: "Data should be updated every {{ time interval }}." E.g. year, month, 6 months, day, second Thursday, etc. 

The new Question Set config sheet is like the `Site` config. It has `key` and `value` columns. It expects a `questions` key, the value is the url the questions sheet, and a `question_set_schema` key, the value is the question set schema in json format (see the [Question Set Schema](#question-set-schema-json-format) section below).

The Dataset property `Title` has been renamed `Name` in the spreadsheet, to reflect the database fieldname used once loaded, and allow translations to work. `Title` will continue to work as a fallback, but isn't translatable with `Title@LC`.

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

## Question Set Schema json format

#####A question set schema provides the structure and dependency graph for a set of `Questions`.

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
        "ifProvider": [
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
        "ifProvider": [
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
        "ifProvider": [
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
        "ifProvider": [
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
                "ifProvider": {
                    "description": "An array of objects containing conditional logic to determine the state of Question properties dependent on the value of other 'Provider' Questions in the Question Set. First matching member takes presidents.",
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
                            "isNotEmpty": {
                                "description": "A boolean to determine whether an expected value is not an empty string, array or object, triggering the condition",
                                "type": "boolean"
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
                        "oneOf": [
                            {"required": ["value", "providerId", "properties"]},
                            {"required": ["isNotEmpty", "providerId", "properties"]}
                        ]
                    }
                },
                "score": {
                    "description": "An object defining the scoring characteristics for this question.",
                    "type": "object",
                    "properties": {
                        "weight": {"type": "number"}
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


[template-config]: https://docs.google.com/spreadsheets/d/1jFEjhAaY2e8hcORnBqYroYy5zKoq6nQWBNXjUYLKbYk/edit#gid=0
[discussion-forum]: https://discuss.okfn.org/c/open-data-index
[transifex]: https://www.transifex.com/projects/p/open-data-census/
