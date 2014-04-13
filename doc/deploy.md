# System Adminstration of Census Instances

These instructions are for Developers. It assumes you already have the code
installed on your machine.

Before you start:

* Check you have a Google account and that this account has access to the
  [census instance spreadsheet][instance]

## Deploying a New Census Instance

If you are **not** a developer but want a Census booted please visit and make a
request <http://meta.census.okfn.org/request/>

[config]: https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0AqR8dXc6Ji4JdG5FYWF5M0o1cHBvQkZLTUdOYWtlNmc
[db]: https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0AqR8dXc6Ji4JdFgwSjlabk0wY3NfT2owbktCME5MY2c
[instance]: https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0AqR8dXc6Ji4JdHZoLXhLMjNVNjVPQzVlaU0tSjNUYlE#gid=0
[city-config]: https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0AqR8dXc6Ji4JdE16XzdsOFgtWGpGVVJ3YVRIQW1jZkE&usp=drive_web

### Before you start

* Identify the `slug` for your app. It will usually be `{2-digit-iso}-{type}`
  where {type} is one of `city` or `region`. The site will then be online at
  `{slug}.census.okfn.org` (the "`site_url`")
* Identify the google user account that will be your database user

IMPORTANT: to make a Google Spreadsheet 'Public on the Web' you must:

* Go to sharing and make world readable
* Go to File Menu => "Publish to the Web" and click "Start Publishing"

### Step-by-Step

* Open the [census instance spreadsheet][instance]. You should add relevant
  info to this as you do next steps.

* Boot a config spreadsheet (copy the template config - [city template][city-config] or [generic template][config])

  * Name in standard way e.g. '{2-digit-iso-code} - City - Config - Open Data Census'
  * Make the sheet 'Public on the Web' (see above)
  * Put it in the relevant folder
  * Add link to this spreadsheet to your instances database sheet

* [optional - you can skip if you use common DB] Create a Database spreadsheet (copy the [DB template][db])

  * Add relevant google user (e.g. opendatacensusapp@gmail.com) as read/write user
  * Make the sheet 'Public on the Web' and world readable
  * Add Database spreadsheet link to your config spreadsheet

* Setup auth - you will need to register the app with Google - see
   https://developers.google.com/accounts/docs/OAuth2#basicsteps

  * Register as a developer
  * Go to [Google cloud console](https://cloud.google.com/console)
  * Create a Project (we suggest id `opendatacensus-{slug}`
  * Go to "APIs & auth" => "Credentials" and click "Create New Client ID" and
    then select "Web Application" and configure.

    * Authorized origins should be: the `site_url` plus the heroku url `opendatacensus-{slug}.herokuapp.com`
    * Note redirect urls should be the site urls plus /auth/google/callback

* Run the `create` script (this will output further instructions)
  
        bin/census create {SLUG}

Optional:

* Set up the DNS so that app is at http://{slug}.census.okfn.org/

   * Contact sysadmin team at Open Knowledge Foundation and request CNAME alias
     of {slug}.census.okfn.org to opendatacensus-{slug}.herokuapp.com
   * For heroku run the command

     `heroku domains:add {slug}.census.okfn.org`

## Managing Existing Instances

Before managing an existing instance you must make sure you have the heroku
remote setup locally. To setup all the heroku remotes for all instances in one
step do:

    bin/census remotes

### Updating the (Environment) Config for an Instance

Most config for censuses lives in the config spreadsheet for that instance and
can be managed by a Census Administrator. However, some config lives in the
Environment (mainly private data). This config data (which is either generated
or pulled from the Instances Database Spreadsheet) can be updated by doing:

    bin/census config {census-id}

For example, to upgrade the national census config you would do:

    bin/census config national

## Upgrading (Code) a Census Instance

**WARNING:** Make sure you've performed any required upgrades to the "database"
spreadsheets. For example, fields may have been added or removed. At present
all database migrations have to be performed manually. See CHANGES.md for a
full list of database changes.

To upgrade the code for an instance to the current master:

    git push {SLUG}

For example, to upgrade demo to latest master do:

    git push demo

To upgrade the code for an instance to a specific branch:

    git push {SLUG} {BRANCH}

For example, to push the production branch to demo do:

    git push demo production

