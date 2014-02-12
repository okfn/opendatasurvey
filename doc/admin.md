# Administrating an Open Data Census

This is a short introduction to how to administer an Open Data Census.

Note: it assumes that a census instance has been booted for you (and is **not**
about the technical side of deploying a census instance)

## Overview of How a Census is Structured

A Census is a survey built around 4 axes:

* Place - e.g. a country of a city
* Dataset - e.g. Timetable
* Question - a specific question we ask about each dataset (e.g. "does it
  exist", "is it machine readable")
* Time - usually a year

We then ask for each Place / Dataset / Time combination for an answer to the
set of "Questions".

The set of answers to the Questions for given Place / Dataset / Time
combination is called a `Submission`.

When a `Submission` has been reviewed and deemed accurate it becomes an `Entry`
in the Census. 

### Contributor and Review Workflow

Contributing new submissions

* Contributors visit the submit page to make a new `Submission`

  * You must be logged in to make a Submission
  
* The Submission will now be displaying awaiting review on the place page for that place

Review

* A reviewer visits the review page for a submission
  * You must be logged in to review
  * You must be an authorized reviewer to review (see `reviewers` config option below)
* The reviewer reviews or rejects the submission
 
### Configuration

Configuration is of two types:

* 'App Config' - the fundamental app configuration for the site (e.g. site
  title) plus pointers to the other config files which are ...
* 'Census Config' - the list of Places, Datasets and Questions to use for this
  census. App Config contains pointers to where to find this.

Both types of configuration should be stored in publicly accessible CSV files
(one file for app config and one each for places, datasets and questions).

Our recommended approach is to have all of these as separate sheets in one
large google spreadsheet that is made 'public on the web' (you can then access
those sheets as CSV files).

Here is a [Template General Config Spreadsheet][config].

The App Config options (the first sheet in that spreadsheet) are fully
documented in the Appendix below.

[config]: https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0AqR8dXc6Ji4JdG5FYWF5M0o1cHBvQkZLTUdOYWtlNmc#gid=0
[db-template]: https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0AqR8dXc6Ji4JdFgwSjlabk0wY3NfT2owbktCME5MY2c&usp=drive_web

Note: there is some very basic bootstrap (and sensitive) information stored by
the developer (like the google username and password for accessing the
database).

### Data Storage

Our primary storage backend is Google Spreadsheets.

* Database of responses (`Submission`s and `Entry`s) - stored in a google
  spreadsheet
  * WARNING: at present this Database must be world-readable (so we can't store
    anything sensitive in it ...)
* User database (optional) - also a google spreadsheet

* [Template Database Spreadsheet][db-template]
  * Note: must have column headings in Submissions and Entries that correspond
    to question ids in question sheet


## Appendix - App Config Documentation

These are the config variables you can set in your config spreadsheet
(a Google Spreadsheet or online CSV file).

Those marked with a (*) must be set.

Here is an [example config spreadsheet][ex] used for testing.

[ex]: https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0AqR8dXc6Ji4JdEg2el9xaUxBcjFnbEYtNnMwLTVmTVE&usp=drive_web#gid=2

Definition: 'application google user' is the Google user(name) (e.g.
opendatacensustest@gmail.com) which will be used by the Census app to access
the data(base) spreadsheets. It is **not** configurable as part of the general
application config but is provided to you your Census Deployer.

### `database` (*)

The url of the Google docs spreadsheet for the primary results database.

This spreadsheet should be world-readable and read/write for the application
google user.

### `user_database_key`

The key of a Google docs spreadsheet that will be the user database.

This is optional. If not provided, login will still be possible but we won't
record user details such as email (we will just store the user id into the
submissions and reviews).

The user spreadsheet must be private as it will contain private user info like
email addresses.

It should be accessible to the applicate google user.

### `title`

Site title - used on the website etc

### `title_short`

Short version of the title

### `display_year`

Year to display information about.

Default is 2014.

### `submit_year`

Default year to collect information about.

Default is 2014.

### `reviewers`

List of reviewer user ids separated by spaces or commas. Reviewer user ids should be of form facebook:{facebook-username}

### `datasets`

URL to a Google Spreadsheet (make sure url is to *actual* sheet you want) or
online CSV file containing a list of datasets to ask questions about.

The structure should follow that in
https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc&usp=drive_web#gid=0

### `places`

URL to a Google Spreadsheet (make sure url is to *actual* sheet your want) or
online CSV file containing a list of places to ask questions about.

The structure should follow that in
https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc&usp=drive_web#gid=7

### `questions`

URL to a Google Spreadsheet (make sure url is to *actual* sheet your want) or
online CSV file containing a list of questions about.

questions MUST follow structure as in
https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc&usp=drive_web#gid=1

In particular, it must have the same set of questions ids (descriptions and
titles can change - e.g. for translation).

### `overview_page`

Content for the overview on the home page (this is just content for top of page above results summary table).

You can use markdown or HTML format.

### `faq_page`

Content for the FAQ page.

You can use markdown or HTML format.

Note: you have access to 2 special variables that can be used in your html or markdown:

* `{{questions}}` - this will be replaced by a table of all the questions
* `{{datasets}}` - this will be replaced by a table of all the datasets

### `about_page`

Content for the about page.

You can use markdown or HTML format.

### `contribute_page`

Content for contribute page.

You can use markdown or HTML format.

### `navbar_logo`

HTML for logo at top right of navbar

Here's some sample HTML (replace links and image with your own!):

    <a href="http://okfn.org/" title="" target="_blank">
      <img src="//assets.okfn.org/images/logo/okfn-logo-landscape-black.png" alt="Logo" />
    </a>

Logo will be scaled to 30px height (so best is if it is already 30px)

### `custom_css`

Custom CSS

### `custom_footer`

Custom footer content

### `google_analytics_key`

Supply a google analytics key to use on the site

