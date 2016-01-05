# Open Data Census

[![Travis Build Status](https://travis-ci.org/okfn/opendatacensus.svg?branch=master)](https://travis-ci.org/okfn/opendatacensus)
[![Coveralls](http://img.shields.io/coveralls/okfn/opendatacensus.svg?branch=master)](https://coveralls.io/r/okfn/opendatacensus?branch=master)

Open Data Census is a web application that supports a submission and review workflow to collect information on the state of open data.

Some presentation of data is supported, along with partitioning results by year.

The code base supports multiple censuses in a multi-tenant configuration, where each tenant runs a census from a subdomain.

Tenant administrators can customize parts of the app, from look and feel to key texts on various views.

## Demo Site

If you want to check out what an Open Data Census site looks like we have a
demo site running at:

<http://demo.census.okfn.org/>

## Overview

See: <http://census.okfn.org/>

### Getting started

Open Data Census is a Node.js app, running Express v4 and Postgres 9.4 for the database.

Get a local server setup with the following steps:

**NOTE**: If you need to prefix your commands in your local environment with `sudo`, then do that.

1. Install Postgres 9.4 on your machine.
2. Setup to appropriate credentials on Google and Facebook so they are OAuth providers for your app.
    * For Google: [follow these steps](https://developers.google.com/identity/protocols/OpenIDConnect) and then enable the Google+ API.
    * For Facebook: [follow these steps](https://developers.facebook.com/docs/facebook-login/)
2. Ensure you are running the supported version of Node.js, which is [declared in the `package.json`](https://github.com/okfn/opendatacensus/blob/develop/package.json#L75).
3. Create a database with `createdb opendatacensus`.
4. Add this line to your hosts file: `127.0.0.1 demo.dev.census.org global.dev.census.org id.dev.census.org system.dev.census.org`.
5. Create a local directory called `opendatacensus` and move into it with `cd opendatacensus`.
6. Clone the code with `git clone https://github.com/okfn/opendatacensus .`.
7. Install the dependencies with `npm install`.
8. Create a `settings.json` file with these contents, changing any values as required:

```
{
  "sysAdmin": "{YOUR_EMAIL}",
  "registryUrl": "https://docs.google.com/spreadsheets/d/18jINMw7ifwUoqizc4xaQE8XtF4apPfsmMN43EM-9Pmc/edit#gid=0",
  "database": {
    "username": "{DB_USERNAME}",
    "password": "{DB_PASSWORD}",
    "database": "opendatacensus",
    "host": "localhost",
    "port": 5432,
    "dialect": "postgres",
    "logging": false,
    "define": {
      "charset": "utf-8",
      "collate": "utf8_general_ci",
      "timestamps": true
    }
  },
  "google": {
    "app_id": "{GOOGLE_APP_ID}",
    "app_secret": "{GOOGLE_APP_SECRET}"
  },
  "facebook": {
    "app_id": "{FACEBOOK_APP_ID}",
    "app_secret": "{FACEBOOK_APP_SECRET}"
  },
  "auth_subdomain": "id",
  "system_subdomain": "system",
  "sentry_dsn": "",
  "discussion_forum": "https://discuss.okfn.org/c/open-data-index"
}
```


Now we should be ready to run the server:

1. Run the app with `npm start`
2. Load registry and config data at `http://system.dev.census.org:5000/control` (You'll need to be logged in and the system administrator to access this)
3. Load the data for a specific site, e.g.: `http://demo.dev.census.org:5000/admin`
4. Visit the site: `http://demo.dev.census.org:5000/`

Other things you can do:

* Run the test suite with npm test
* Check your code style with npm run jscs (according to the Google style guide)


### Configuration Sheets

Most of the site configuration is taken from config sheets in Google Sheets. You can use [this registry sheet](https://docs.google.com/spreadsheets/d/18jINMw7ifwUoqizc4xaQE8XtF4apPfsmMN43EM-9Pmc/edit#gid=0) and its linked sheets as examples and clone them as necessary.

**NOTE**: Ensure your registry and all other config sheets have been published as CSV in Google Sheets (click File, Publish to the Web).

### Deployment

We run deployments on Heroku. The app should run anywhere that you can run Node.js and Postgres. The important thing to remember for deployments is that the `settings.json` file you are using for local development is not available, and therefore you need to configure many settings via environment variables. The key settings you should ensure you set are:

* `SESSION_SECRET`
* `BASE_DOMAIN`
* `DATABASE_URL`
* `SYS_ADMIN`
* `FACEBOOK_APP_ID`
* `FACEBOOK_APP_SECRET`
* `GOOGLE_APP_ID`
* `GOOGLE_APP_SECRET`

### i18n For Templates

When templates change, the translations have to be changed. Extract the files by running this command:

    gulp pot

You will need the GNU gettext commands. See [here](https://github.com/mozilla/i18n-abide/blob/master/docs/GETTEXT.md) for more information.

To update the existing .po files, run:

    gulp update-po

To add a new language, create directory `locale/[language-code]/LC_MESSAGES` and put there translation files (*.po).
Also, you can copy the `locale/en` directory to `locale/[language-code]` and change existing files.

To update translations cache, run

    gulp compile-po

### i18n For Config

Any column can be internationalised by adding another column with `@locale` after it. For example, the `description` column can be translated to German by adding a column of `description@de`. Only languages which have template translations created for them are valid. The `locales` setting in the config document can be used to restrict the number of locales available. The first locale in the list is the default locale.

### Running Tests

```
createdb opendatacensus_test
npm test
```

------

## Heroku Deployment

TBD: This section needs to be updated. The basics of deployment now are just to use the normal heroku commands, as now, one codebase powers multiple census sites.
