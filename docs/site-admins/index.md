# Site Admin Documentation

This is a short introduction to how to administer an Open Data Census.

Note: it assumes that a census instance has been booted for you (and is __not__ about the technical side of deploying a census instance)

## Table of contents

[TOC]

## Overview of How a Census is Structured

A Census is a survey built around 4 axes:

 * Place – e.g. a country or a city
 * Dataset – e.g. Timetable
 * Question – a specific question we ask about each dataset (e.g. "does it exist", "is it machine readable")
 * Time – usually a year

We then ask of each Place / Dataset / Time combination for an answer to the set of "Questions".

The set of answers to the Questions for given Place / Dataset / Time combination is called a `Submission`.

When a `Submission` has been reviewed and deemed accurate it becomes an `Entry` in the Census.

### Workflow

#### New submissions

 * Contributors visit the `/submit/` page to make a new `Submission`
 * This `Submission` is now queued awaiting review by a reviewer (see next item for details of what that will mean)
    * The `approve_first_submission` config variable can be set to TRUE in order to approve the first submission for a place/dataset/year automatically, without review.
    * Reviewers can be set in three places: 
      * In the config sheet, where the reviewers can review all data for the instance
      * In the datasets sheet, where the reviewers can review all data for a particular dataset
      * In the places sheet, where the reviewers can review all data for a particular place

#### Reviewing a submission

 * A reviewer visits the place page for a given place (e.g. `/place/gb`) – normally they will do this via the front page
 * A reviewer clicks on the "View Submission" button next to a pending submission:

   ![census-review](/files/census-review.png)

 * A reviewer visits the review page for a submission
    * You must be logged in to review
    * You must be an authorized reviewer to review (see `reviewers` config option below)
 * The reviewer reviews or rejects the submission
    * If approved the submission will now become the "entry" for that place and show up in the overview and elsewhere
    * If rejected the submission will be marked as rejected and will no longer show up

### Configuration

Each Census **site** is configured via Google Spreadsheets. Each spreadsheet must be "public on the web" **and** "published to the web" (see Google Spreadsheets for details on how to ensure this).

We can divide the configuration required for a **site** into two types:

 * **'Site config'** – the fundamental configuration for a site, such as the title, plus links to the other config sheets required (e.g.: places, datasets and questions)
 * **'Census config'** – the list of Places, Datasets and Questions to use for this census. The site config contains pointers to where to find these.

Both types of configuration should be stored in publicly accessible Google spreadsheets (one file for app config and one each for places, datasets and question sets).

Our recommended approach is to have all of these as separate sheets in one large google spreadsheet document that is made 'public on the web' (each sheet can then be accessed as a CSV file).

Here is a [Template General Config Spreadsheet][template-config].

The Site config options (the first sheet in that spreadsheet) are documented in the Appendix below.

## How-tos

### Configuring your Census

For the Census to work properly you need to do some initial basic configuration:

 * Add a list of places for the Census to cover – see [Setting up Places](#setting-up-places) below
 * Set a `title` value in your General Config as appropriate e.g. "US City Open Data Census"

Next steps:

 * If you want reviewing to work you will need to configure the list of reviewers – see instructions below

Extras – set additional content e.g.

 * Add a logo – `navbar_logo` config variable
 * Some short text on the front page – 3-4 sentences about what this is – `overview_page` config variable
 * About page – `about_page` config variable
 * FAQ page – `faq_page` config variable

### Setting up Places

 * Add places to the Places sheet in your Config Spreadsheet
 * The id column should only have lowercase ASCII alphanumeric characters and '-'. For example:
    * OK: 'sanfrancisco' or 'san-francisco'
    * Not OK: 'san francisco' (space) or 'SanFrancisco' (uppercase) or 'München' (non-Ascii character)
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

#### Translating Questions

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
 * Translate the Name, Description, UpdateEvery, and Characteristics:n columns into the desired primary language
 * Reload Datasets from the site admin page: <http://{your-census-id}.survey.okfn.org/admin>

To add another, second language (partial support for multiple languages): 

 * Add a column Name@{LANG}, Description@{LANG}, and Characteristics:n@{LANG} (one for each Characteristic) to the Datasets sheet, where {LANG} is your 2 digit iso code (UpdateEvery is not currently supported)
 * Translate the original Name and Description into your secondary language and enter into the new columns you created
 * Reload Datasets from the site admin page: <http://{your-census-id}.survey.okfn.org/admin>


#### Translating General Site Content

 * Visit the [Open Data Census translation project on Transifex][transifex]
    * Create an account if you need one
 * Submit translations
 * Notify the Open Data Census Managers on the [discussion forum][discussion-forum] when the translation is complete

### Customizing the List of Datasets

 * Go into your Config Spreadsheet and select the Datasets sheet
 * Fill out the Datasets sheet following the structure provided. You can ignore the Category column.
    * It is important to add reasonably detailed descriptions for the datasets so people are clear what they are looking for and how to answer.
    * We recommend not having more than ~ 15-17 datasets in your Census
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

List of reviewer emails separated by commas.

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

### approve_first_submission

Determines whether the first submission requires review by a reviewer.

Default is FALSE i.e. all submission must be reviewed.

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

[template-config]: https://docs.google.com/spreadsheets/d/1jFEjhAaY2e8hcORnBqYroYy5zKoq6nQWBNXjUYLKbYk/edit#gid=0
[discussion-forum]: https://discuss.okfn.org/c/open-data-index
[transifex]: https://www.transifex.com/projects/p/open-data-census/
