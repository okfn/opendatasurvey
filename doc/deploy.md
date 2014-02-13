## Creating a New Census App

These instructions are for Developers. It assumes you already have the code
installed on your machine.

If you are **not** a developer but want a Census booted please visit and make a
request <http://meta.census.okfn.org/request/>

[config]: https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0AqR8dXc6Ji4JdG5FYWF5M0o1cHBvQkZLTUdOYWtlNmc
[db]: https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0AqR8dXc6Ji4JdFgwSjlabk0wY3NfT2owbktCME5MY2c
[instance]: https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0AqR8dXc6Ji4JdHZoLXhLMjNVNjVPQzVlaU0tSjNUYlE#gid=0

## Before you start

* Check you have a Google account and that this account has access to the
  [census instance spreadsheet][instance]
* Identify the `slug` for your app. It will usually be `{2-digit-iso}-{type}`
  where {type} is one of `city` or `region`. The site will then be online at
  `{slug}.census.okfn.org` (the "`site_url`")
* Identify the google user account that will be your database user

IMPORTANT: to make a Google Spreadsheet 'Public on the Web' you must:

* Go to sharing and make world readable
* Go to File Menu => "Publish to the Web" and click "Start Publishing"

## Step-by-Step

* Open the [census instance spreadsheet][instance]. You should add relevant
  info to this as you do next steps.

* Boot a config spreadsheet (copy the [template][config])

  * Add sheets for general config and for places, datasets and questions (see
    [template][config])
  * Make the sheet 'Public on the Web' (see above)
  * Set essential config that should not be changed e.g. `site_url`

* Create a Database spreadsheet (copy the [DB template][db])

  * Add relevant google user (e.g. opendatacensusapp@gmail.com) as read/write user
  * Make the sheet 'Public on the Web' and world readable

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

### TODO

Document key config that needs to be set e.g.

* site_url
* configUrl

