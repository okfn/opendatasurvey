# Open Data Census

[![Build](https://img.shields.io/github/workflow/status/okfn/opendatasurvey/general/master)](https://github.com/okfn/opendatasurvey/actions)

Open Data Census is a web application that supports a submission and reviews workflow to collect information on the state of open data.

Some presentation of data is supported, along with partitioning results by year. The code base supports multiple censuses in a multi-tenant configuration, where each tenant runs a census from a subdomain.

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
    * For Google: [follow these steps](https://developers.google.com/identity/protocols/OpenIDConnect)
      * The callBack url for Google+ API is: `http://id.dev.census.org:5000/google/callback`
    * For Facebook: [follow these steps](https://developers.facebook.com/docs/facebook-login/)
      * The callBack url for Facebook is: `http://id.dev.census.org:5000/facebook/callback`
3. Ensure you are running the supported version of Node.js, which is [declared in the 'engines' section of `package.json`](package.json).
4. Create a database with `createdb opendatacensus`.
5. Add this line to your hosts file: `127.0.0.1 demo.dev.census.org global.dev.census.org id.dev.census.org system.dev.census.org`.
6. Create a local directory called `opendatasurvey` and move into it with `cd opendatasurvey`.
7. Clone the code with `git clone https://github.com/okfn/opendatasurvey .`.
8. Install the dependencies with `npm install`.
9. Create a copy of `settings.json.example` file and name it `settings.json` changing any values as required.

Now we should be ready to run the server:

1. Run the app with `npm start` (the server will be run on the 5000 port)
2. Log in at `http://id.dev.census.org:5000/login` with your admin account (the same that was setup on the **settings.json** file)
3. Load registry and config data at `http://system.dev.census.org:5000/control`
4. Load the data for a specific site, e.g.: `http://demo.dev.census.org:5000/admin`
5. Visit the site: `http://demo.dev.census.org:5000/`

Other things you can do:

* Run the test suite with `npm test`
* Check your code style with `npm run lint` using the eslint config `/.eslintrc`.


### Configuration Sheets

Most of the site configuration is taken from config sheets in Google Sheets. You can use [this registry sheet](https://docs.google.com/spreadsheets/d/1qr0wn9JePirV1avY5DmnCJPKudbYIoX0TDAp4WZWNqU/edit#gid=0) and its linked sheets as examples and clone them as necessary.

**NOTE**: Ensure your registry and all other config sheets have been published as CSV in Google Sheets (click File, Publish to the Web).

### Deployment

We run deployments on Heroku. The app should run anywhere that you can run Node.js and Postgres. The important thing to remember for deployments is that the `settings.json` file you are using for local development is not available, and therefore you need to configure several settings via environment variables. The key settings you should ensure are set:

* `SESSION_SECRET`
* `BASE_DOMAIN`
* `DATABASE_URL`
* `SYS_ADMIN`
* `FACEBOOK_APP_ID`
* `FACEBOOK_APP_SECRET`
* `GOOGLE_APP_ID`
* `GOOGLE_APP_SECRET`

### i18n For Templates and core code

When templates or strings in core code change, the translations have to be changed. Extract strings to the `messages.pot` file by running this command:

    ./node_modules/.bin/gulp pot

You will need the GNU gettext commands. See [here](https://github.com/mozilla/i18n-abide/blob/master/docs/GETTEXT.md) for more information.

To update the existing .po files, run:

    ./node_modules/.bin/gulp update-po

To add a new language, create the directory `locale/[language-code]/LC_MESSAGES` and create the translation files (*.po). Alternatively, you can copy the `locale/en` directory to `locale/[language-code]` and change existing files.

To update the translations cache, run:

    ./node_modules/.bin/gulp compile-po

### i18n For Config

Any column can be internationalised by adding another column with `@locale` after it. For example, the `description` column can be translated to German by adding a column of `description@de`. Only languages which have template translations created for them are valid. The `locales` setting in the config document can be used to restrict the number of locales available. The first locale in the list is the default locale.

### Removing a user

A script is provided to remove users by provider id. Removing a user will update entries where the user is a submitter or reviewer (changing the user id to the anonymous user), then remove the user.

`$ npm run anonymize_user -- <provider-id>`

Use `-d` to perform a dry run, which will print the user id, and entry ids which will be affected (where the user is either a submitter or reviewer).


### Running Tests

```
createdb opendatacensus_test
npm test
```
