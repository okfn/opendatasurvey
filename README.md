# Open Data Census

[![Build Status](https://travis-ci.org/okfn/opendatacensus.png?branch=master)](https://travis-ci.org/okfn/opendatacensus)

Webapp for doing [Open Data Censuses][] including submission workflow,
presentation of results and some visualization.

[Open Data Census]: http://census.okfn.org/

This also includes various ancillary information providing an overview of what
is happening with release of open government data around the world (and
initiatives related to it).

## Architecture

### Concepts

A Census is a survey built around 4 axes:

* Place - e.g. a country of a city
* Dataset - e.g. Timetable
* Question - a specific question we ask about each dataset (e.g. "does it exist", "is it machine readable")
* Time - usually a year

We then ask for each Place / Dataset / Time combination for an answer to the set of "Questions".

The set of answers to the Questions for given Place / Dataset / Time combination is called a `Submission`.

When a `Submission` has been reviewed and deemed accurate it becomes an `Entry` in the Census. 

### Access Control

You must be logged in to make a Submission or review a Submission. Login is via
Facebook. We store sensitive user info (e.g. password) in a closed central DB.

*Note*: you can also lock down the entire app if you set `auth_on` config.

### Developer Stuff

The app is a simple Express NodeJS app designed to be deployed on Heroku.

We have 2 main branches:

* master - development branch - deploy to <http://opendatacensus-staging.herokuapp.com/>
* production - release branch (production ready code) - deploy to <http://census.okfn.org/>

Our primary storage backend is Google Spreadsheets. (If you are wondering why see the appendix).

More precisely, we store 2 sets of things:

* Configuration (including the list of Places, Datasets and Questions). Stored in:
  * Heroku environment - sensitive configuration (e.g. google login) plus
    bootstrap link to general config (next item)
  * Public CSV files (usually use CSV file access to a Google spreadsheet) -
    general config plus the list of places, datasets and questions (each a
    separate CSV file)
* Database of responses (`Submission`s and `Entry`s) - stored in a google
  spreadsheet
  * WARNING: at present this Database must be world-readable (so we can't store
    anything sensitive in it ...)

The basic route for the config loading is as follows:

* App boots
* Looks up environment variable `CONFIG_URL` (plus sensitive config like DB
  login)
* Loads CSV file at `CONFIG_URL` - this file has pointers to all other config
  information (see below for a template)
* Loads all other config CSV files (Places, Datasets, Questions)


### Config and DB Templates

Our recommended approach is to keep all the config in one big google spreadsheet and then point 

* [Template General Config Spreadsheet][config] - which in turn has pointers to other templates
* [Template Database Spreadsheet][db-template]
  * Note: must have column headings in Submissions and Entries that correspond
    to question ids in question sheet

[config]: https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0AqR8dXc6Ji4JdG5FYWF5M0o1cHBvQkZLTUdOYWtlNmc#gid=0
[db-template]: https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0AqR8dXc6Ji4JdFgwSjlabk0wY3NfT2owbktCME5MY2c&usp=drive_web


### Facebook Auth

For Facebook Auth you will need to create an App on Facebook developers section
and set various config. See config section below for detail.

------


## Creating a New Census App

[For Developers - if you want a Census booted for you see <http://meta.census.okfn.org/request/>]

1. Boot a config spreadsheet

  * Add sheets for general config and for places, datasets and questions (see
    templates above)
  * Make the sheet 'Public on the Web' and world readable

2. Create a Database spreadsheet (copy the template - see above)

  * Add opendatacensusapp@gmail.com as read/write user
  * Make the sheet 'Public on the Web' and world readable

2. Create a new Heroku app `opendatacensus-{slug-name}`

   * `heroku apps:create opendatacensus-{slug-name} --remote {slug-name}`
   * Set up the environment config (see below)
   * Deploy

        git push {slug-name} master
   
   * Should now be live at http://{slug-name}.herokuapp.com/

3. [optional] Set up the DNS


------

## Developing the Code

### Install Locally

To install do the following:

1. Get the code and init the submodules (for recline vendor library)

        git clone https://github.com/okfn/opendatacensus
        git submodule init
        git submodule update

2. Install node dependencies

        cd opendatacensus
        npm install .

3. Run the app

        node run.js

4. Should now be running at <http://localhost:5000>


### Configuration

Core configuration is listed in lib/config.js which loads from environment
variables and then via `lib/util.js` `load` method to pull in config from CSV
files.

Setting up Facebook for Login:

* Register as a developer
* Create an App
* Go to Basic Settings and select Add Platform
* Enter the site url of your site

#### Over-riding for development

For convenience when doing local development, you can selectively override your
own local config using a `settings.json` as follows:

* Create `settings.json`
* Copy the config object from lib/config.js and override relevant parts. Note
  you don't need the whole object only the bits you want to change. For example:

        {
          "google": {
            "user": "xxx",
            "password": "yyy"
          }
        }

Note this will **not** work for Heroku - instead you need to do everything via
environment variables: https://devcenter.heroku.com/articles/config-vars

### Running Tests

Install mocha (see devDependencies in package.json) then do:

    mocha tests/

------

## Heroku Deployment

We have multiple apps on Heroku including:

* Production: `opendatacensus` - push there from production branch
* Staging: `opendatacensus-staging` - push from master

To work with a given remote:

    heroku --remote production ...

To work with these do:

    heroku git:remote -r production -a opendatacensus
    heroku git:remote -r staging -a opendatacensus-staging
    # this way git push heroku master will push to staging
    heroku git:remote -a opendatacensus-staging

To avoid error suggest making the staging app the default:

    git config heroku.remote staging

## Appendix - Why Google Spreadsheets for the DB

Pros

* being easy to hand-edit and view (esp for non-techies)
* multiple formats
* versioned (so all changes are recorded)

Cons

* Google Spreadsheets has limited storage (400k cells etc). However, our data
  requirements are usually quite limited for each census.


