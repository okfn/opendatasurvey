---
layout: default
title: Documentation
---

This is a short introduction to how to administer an Open Data Census.

Note: it assumes that a census instance has been booted for you (and is __not__ about the technical side of deploying a census instance)

* Table of contents
{:toc}

## Overview of How a Census is Structured

A Census is a survey built around 4 axes:

 * Place – e.g. a country of a city
 * Dataset – e.g. Timetable
 * Question – a specific question we ask about each dataset (e.g. "does it exist", "is it machine readable")
 * Time – usually a year

We then ask for each Place / Dataset / Time combination for an answer to the set of "Questions".

The set of answers to the Questions for given Place / Dataset / Time combination is called a `Submission`.

When a `Submission` has been reviewed and deemed accurate it becomes an `Entry` in the Census.

### Workflow

#### New submissions

 * Contributors visit the `/submit/` page to make a new `Submission`
 * This `Submission` is now queued awaiting review by a reviewer (see next item for details of what that will mean)
    * Note: we have recently introduced a change to this workflow so that __the first submission for a given place + dataset is automatically "approved" (without review).__ In this case the Submission won't need to be reviewed and will automatically become the "Entry" for that place + dataset.
    * This behaviour can be disabled by setting `approve_first_submission` config variable to TRUE.

#### Reviewing a submission

 * A reviewer visits the place page for a given place (e.g. `/place/gb`) – normally they will do this via the front page
 * A reviewer clicks on the "review now" button next to the ![census-review](/files/2014/02/census-review.png)
 * A reviewer visits the review page for a submission
    * You must be logged in to review
    * You must be an authorized reviewer to review (see `reviewers` config option below)
 * The reviewer reviews or rejects the submission
    * If approved the submission will now become the "entry" for that place and show up in the overview and elsewhere
    * If rejected the submission will be marked as rejected and will no longer show up

### Configuration

Configuration is of two types:

 * 'App Config' – the fundamental app configuration for the site (e.g. site title) plus pointers to the other config files which are …
 * 'Census Config' – the list of Places, Datasets and Questions to use for this census. App Config contains pointers to where to find this.

Both types of configuration should be stored in publicly accessible CSV files (one file for app config and one each for places, datasets and questions).

Our recommended approach is to have all of these as separate sheets in one large google spreadsheet that is made 'public on the web' (you can then access those sheets as CSV files).

Here is a [Template General Config Spreadsheet][template-config].

The App Config options (the first sheet in that spreadsheet) are fully documented in the Appendix below.

Note: there is some very basic bootstrap (and sensitive) information stored by the developer (like the google username and password for accessing the database).

### Data Storage

Our primary storage backend is Google Spreadsheets.

 * Database of responses (`Submission`s and `Entry`s) – stored in a google spreadsheet
    * WARNING: at present this Database must be world-readable (so we can't store anything sensitive in it …)
 * User database (optional) – also a google spreadsheet
 * [Template Database Spreadsheet][template-db]
    * Note: must have column headings in Submissions and Entries that correspond to question ids in question sheet

## Howtos

### Configuring your Census

For the Census to work properly you need to do some initial basic configuration:

 * Add a list of places for the Census to cover – see [Setting up Places](#setting-up-places) below
 * Set `title` value in your General Config as appropriate e.g. "US City Open Data Census"

Next steps:

 * If you want reviewing to work you will need to configure the list of reviewers – see instructions below

Extras – set additional content e.g.

 * Add a logo – `navbar_logo` config variable
 * Some short text on the front page – 3-4 sentences about what this is – `overview_page` config variable
 * About page – `about_page` config variable
 * FAQ page – `faq_page` config variable

### Reload the Config

The config for the census (including the list of places and datasets) is cached and won't automatically update when you change the spreadsheet. To get the Census app to reload the config visit:

<http://{your-census-site}/admin/reload>

### Setting up Places

 * Add places to the Places sheet in your Config Spreadsheet
 * The id column should only have lowercase ASCII alphanumeric characters and '-'. For example:
    * OK: 'sanfrancisco' or 'san-francisco'
    * Not OK: 'san francisco' (space) or 'SanFrancisco' (uppercase) or 'München' (non-Ascii character)
 * The Name column can have any characters you like (including non-ASCII)

__Remember to reload the config once you have finished to have your new list of Places show up in the app.__

### Setting up Reviewers

To give a user Reviewer 'privileges' you must add them to the reviewers config – see below.

__Remember to reload your config once done.__

### Localization

This section describes how to have site content presented in languages other than English.

There are 2 types of material that could be localized:

 * General site content (note this content is quite limited as most text on the site comes from configurable info)
 * 'Configurable' content such as question titles and descriptions, the names and descriptions of datasets etc

To have your site presented in a given language you need to:

 * Make sure the relevant content is translated (if not already done, you'll need to do it) – instructions in next sections
 * Configure your Census site so that a particular language is shown – see the locales config option in the config options section below

#### Translating Questions

This is about translating the question descriptors used in the submission forms etc. To translate question information:

 * Make a copy of the [standard questions spreadsheet][template-questions]
 * Add a column Question@{LANG} and Description@{LANG} where {LANG} if your 2 digit iso code
 * Enter translations of the english values of Question and Description in your new columns
 * Notify the Open Data Census Managers on the mailing list that the translation is done
 * Email the [open data census mailing list][mailing-list] that the translation is done so Open Data Census Managers know
 * The Census Managers will then incorporate your translations back in the the main questions spreadsheet

#### Translating Datasets

This is about translating the dataset information (title, descriptions etc). To translate dataset information:

 * Add a column Title@{LANG} and Description@{LANG} to the Datasets sheet – if you are running off the [default, standard set of city datasets][template-city] then make a copy of this sheet to do this
 * Translate the original title and description into your language and enter into the new columns you created
 * Email the [open data census mailing list][mailing-list] that the translation is done (that way translations can go back into master dataset sheet if needed)

#### Translating General Site Content

 * Visit the [Open Data Census translation project on Transifex][transifex]
    * Get an account if you need one
 * Submit translations
 * When you are done email the [open data census mailing list][mailing-list] so that Open Data Census Managers can integrate the translation

### Customizing the List of Datasets

Note: here is the [Standard City Datsets sheet][template-city]

 * Go into your Config Spreadsheet
 * Fill out the sheet named "Datasets" in your config spreadsheet following the structure provided. You can ignore the Category column.
    * It is important to add reasonably detailed descriptions for the datasets so people are clear what they are looking for and how to answer.
    * We recommend not having more than ~ 15-17 datasets in your Census
 * Copy the URL of the spreadsheet (make sure you have the Datasets sheet showing when you do this)
 * Paste this URL as the value for the datasets key in the General Config sheet (add this key if not present)
 * Reload the config

## General Config Options

These are the config variables you can set in the the "General Config" sheet of your config spreadsheet (a Google Spreadsheet or online CSV file).

Those marked with a (*) must be set.

Some definitions:

 * 'application google user' is the Google user(name) (e.g. opendatacensustest@gmail.com) which will be used by the Census app to access the data(base) spreadsheets. It is __not__ configurable as part of the general application config but is provided to you by the "Census Deployer".
 * 'user id' – some configuration items require you to specify users 'user id' (e.g. the reviewers field). The user id of a logged in user on a Census application is of the form: google:{id} where {id} is the Google id of that user (same as their G+ id). Here are some [instruction on how to find a Google id][find-g-id].

### title

Site title – used on the website etc

### title_short

Short version of the title

### locales

Set list of language locales that should be available for your site. See [Localization](#localization) above for more details. Format is space separated 2-digit language codes. First language is the default for the site. For example, to have a site in German and English (German by default) set value to:

`de en`

### display_year

Year to display information about.

Default is 2014.

### submit_year

Default year to collect information about.

Default is 2014.

### reviewers

List of reviewer emails (as used on their google account) or user ids (as defined above), separated by spaces or commas.

### datasets

URL to a Google Spreadsheet (make sure url is to *actual* sheet you want) or online CSV file containing a list of datasets to ask questions about.

The structure should follow that in the [standard city datasets][template-city].

### places

URL to a Google Spreadsheet (make sure url is to the *actual* sheet you want) or online CSV file containing a list of places to ask questions about.

The structure should follow that in https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc&usp=drive_web#gid=7

You can _optionally_ add a Reviewers column that accepts a comma separated list
of emails. These users will then have access to approve or reject revisions
submitted for datasets in that place.

### questions

__We strongly recommend against customizing the questions. The app may well break if you change the questions.__

`questions` must be a URL to a Google Spreadsheet (make sure url is to the *actual* sheet you want) or online CSV file containing a list of questions about.

These questions will then be used instead of the standard questions.

The spreadsheet MUST follow structure as in the [default questions spreadsheet][template-questions].

### approve_first_submission

Determines whether the first submission requires review by a reviewer.

Default is FALSE i.e. the first submission is auto-approved.

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

  * `{{ "{{questions" }}}}` - this will be replaced by a table of all the questions
  * `{{ "{{datasets" }}}}` - this will be replaced by a table of all the datasets

### about_page

Content for the about page.

You can use markdown or HTML format.

### contribute_page

Content for contribute page.

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

### database (*)

__This will normally be set for you by the deployer. Do not change its value unless you know what you are doing!__

The url of the Google docs spreadsheet for the primary results database.

This spreadsheet should be world-readable and read/write for the application google user.

### user_database_key

__This will usually be set in the deployment config so you will not need to set it.__

The key of a Google docs spreadsheet that will be the user database.

This is optional. If not provided, login will still be possible but we won't record user details such as email (we will just store the user id into the submissions and reviews).

The user spreadsheet must be private as it will contain private user info like email addresses.

It should be accessible to the applicate google user.


[template-config]: https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0AqR8dXc6Ji4JdG5FYWF5M0o1cHBvQkZLTUdOYWtlNmc#gid=0
[template-db]: https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0AqR8dXc6Ji4JdFgwSjlabk0wY3NfT2owbktCME5MY2c&usp=drive_web
[template-questions]: https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0AqR8dXc6Ji4JdFI0QkpGUEZyS0wxYWtLdG1nTk9zU3c&usp=drive_web#gid=0
[mailing-list]: http://lists.okfn.org/mailman/listinfo/open-data-census
[template-city]: https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0AqR8dXc6Ji4JdEEwSFF6OTJTMnhYa3h2ZS1temlDS3c&usp=drive_web#gid=0
[transifex]: https://www.transifex.com/projects/p/open-data-census/
[find-g-id]: http://ansonalex.com/google-plus/how-do-i-find-my-google-plus-user-id-google/
