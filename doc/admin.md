# Config Options

*Context for this info on config options is provided by the main Admin
documentation at <http://meta.census.okfn.org/doc/>*

These are the config variables you can set in your config spreadsheet
(a Google Spreadsheet or online CSV file).

Those marked with a (*) must be set.

Some definitions:

* 'application google user' is the Google user(name) (e.g.
  opendatacensustest@gmail.com) which will be used by the Census app to access
  the data(base) spreadsheets. It is **not** configurable as part of the
  general application config but is provided to you your Census Deployer.
* 'user id' - some configuration items require you to specify users 'user id'
  (e.g. the reviewers field). The user id of a logged in user on a Census
  application is of the form: `google:{id}` where `{id}` is the Google id of
  that user (same as their G+ id). Here are some [instruction on how to find a
  Google id][find-g-id].

[find-g-id]: http://ansonalex.com/google-plus/how-do-i-find-my-google-plus-user-id-google/

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

You can _optionally_ add a Reviewers column that accepts a comma separated list
of emails. These users will then have access to approve or reject revisions
submitted for datasets in that place.

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

### `submit_page`

Instructions for the top of the submit page.

You can use markdown or HTML format.

### `review_page`

Instructions for the top of the review page.

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

### `census_id`

Unique short id for the Census. You will not normally have to set this as it
will be set in core config by census deployer.

### `database` (*)

**This will normally be set for you by the deployer. Do not change its value
unless you know what you are doing!**

The url of the Google docs spreadsheet for the primary results database.

This spreadsheet should be world-readable and read/write for the application
google user.

### `user_database_key`

**This will usually be set in the deployment config so you will not need to set
it.**

The key of a Google docs spreadsheet that will be the user database.

This is optional. If not provided, login will still be possible but we won't
record user details such as email (we will just store the user id into the
submissions and reviews).

The user spreadsheet must be private as it will contain private user info like
email addresses.

It should be accessible to the applicate google user.
