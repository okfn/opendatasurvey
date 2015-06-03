# Open Data Census

[![Build Status](https://travis-ci.org/okfn/opendatacensus.png?branch=master)](https://travis-ci.org/okfn/opendatacensus)

Webapp for doing [Open Data Censuses][http://census.okfn.org/] including submission workflow,
presentation of results and some visualization.

This also includes various ancillary information providing an overview of what
is happening with release of open government data around the world (and
initiatives related to it).

## Demo Site

If you want to check out what an Open Data Census site looks like we have a
demo site running at:

<http://demo.census.okfn.org/>

## Overview

See: <http://meta.census.okfn.org/doc/>

### Getting started

Open Data Census is a Node.js app, running Express v4 and Postgres 9.4 for the database.

Get a local server setup with the following steps:

**NOTE**: While we are in development, after cloning, make sure you switch to the `feature/database` branch!

1. Install Postgres 9.4 on your machine
2. Ensure you are running the supported version of Node.js, which is [declared in the `package.json`](https://github.com/okfn/opendatacensus/blob/feature/database/package.json#L58)
3. Create a database with `createdb opendatacensus`
4. Add this line to your hosts file: `127.0.0.1 demo.dev.census.org gb-city.dev.census.org`
5. Create a local directory called `opendatacensus` and move into it with `cd opendatacensus`
6. Clone the code with `git clone https://github.com/okfn/opendatacensus .`
7. Install the dependencies with `npm install`
8. Create a `settings.json` file with these contents, changing any database connection values as required:

```
{
  "configUrl": "https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=1QvZFGyICiuZmRxVll6peXkND_6QmHl7IQ_BYCw5Sso4&usp=sharing#gid=0",
  "censusid": "demo",
  "base_domain": "dev.census.org",
  "database": {
    "username": "",
    "password": "",
    "database": "opendatacensus",
    "host": "localhost",
    "port": 5432,
    "dialect": "postgres",
    "underscored": true,
    "freezeTableName": true
  }
}
```

Now we should be ready to run the server:

1. Run the app with `node run.js`
2. Visit the app in your browser at `http://demo.dev.census.org:5000/`

**NOTE**: Each app instance manages multiple census sites via subdomains. Hence, we require mapping in your hosts file for this. The mappings created above, `demo` and `gb-city` are just for example. Create whatever mapping you will need, and ensure that these are matched by entries in the Registry and Site models (TBD).

### i18n For Templates

When templates change, the translations have to be changed. Extract the files by running this command:

    gulp pot

You will need the GNU gettext commands. See [here](https://github.com/mozilla/i18n-abide/blob/master/docs/GETTEXT.md) for more information.

To update the existing .po files, run:

    gulp update-po

To add a new language, copy the `locale/en` directory to `locale/[language-code]`.

### i18n For Config

Any column can be internationalised by adding another column with `@locale` after it. For example, the `description` column can be translated to German by adding a column of `description@de`. Only languages which have template translations created for them are valid. The `locales` setting in the config document can be used to restrict the number of locales available. The first locale in the list is the default locale.

### Running Tests

* Install dev dependencies and mocha - `npm install -d`
* Get the opendatacensustest google user login and add to `settings.json`

Then run the tests:

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
