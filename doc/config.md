## Administrator Config

These are the config variables you can set in your primary config spreadsheet
(CSV file).

Those marked with a (*) must be set.

Here is an [example config spreadsheet][ex] used for testing.

[ex]: https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0AqR8dXc6Ji4JdEg2el9xaUxBcjFnbEYtNnMwLTVmTVE&usp=drive_web#gid=2

### `database_spreadsheet_key` (*)

The key of a Google docs spreadsheet.

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

URL to an online CSV file containing a list of datasets to ask questions about. The structure should follow that in https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc&usp=drive_web#gid=0

### `places`

URL to an online CSV file containing a list of places to ask questions about. The structure should follow that in https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc&usp=drive_web#gid=7

### `questions`

URL to a CSV file with a list of questions (usually this will be the CSV version of a google spreadsheet).

We STRONGLY recommend using questions as in https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc&usp=drive_web#gid=1"

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

