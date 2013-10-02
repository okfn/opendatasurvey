Open Data Census
================

[![Build Status](https://travis-ci.org/okfn/opendatacensus.png?branch=master)](https://travis-ci.org/okfn/opendatacensus)

Website for the [Open Data Census][] including submission workflow,
presentation of results and visualizations.

[Open Data Census]: http://census.okfn.org/

This also includes various ancillary information providing an overview of what
is happening with release of open government data around the world (and
initiatives related to it).

Background and Resources
------------------------

Read the [Project README and Overview][readme].

* [Open Data Census folder in Google Docs](https://drive.google.com/a/okfn.org/#folders/0B6R8dXc6Ji4JTWE0TVhFejYza2c)
* [Original User Stories][stories]
* [Data Catalogs Spreadsheet][catalogs]

[stories]: https://docs.google.com/document/d/1Ji2pifZYSggdgp0Pe8s_vFNrZIvrgwB1OhYz0AdkGsc/edit
[readme]: https://docs.google.com/a/okfn.org/document/d/1gDa98Gz4PtblMYjMzbj2TvBTBsbhdYtJdDSxQLc70Tw/edit
[catalogs]: https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0Aon3JiuouxLUdE9POFhudGd6NFk0THpxR0NicFViRUE#gid=1

How it works technically
-------------------------

Census is being performed at 2 different levels:

* Country level
* City / regional level

The set of datasets asked about for each level are different but the questions asked per dataset are very similar.

We use google spreadsheets as a backend for the Open Data Census. Data is stored in 3 different spreadsheets:

* [Dataset and Questions spreadsheet][questions] - this list the datasets for
  the country and city census as well as the questions asked for each dataset
* [Country spreadsheet][country]
* [City and Region spreadsheet][city]

[questions]: https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc#gid=0
[country]: https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0Aon3JiuouxLUdEVnbG5pUFlyUzBpVkFXbXJ2WWpGTUE#gid=6
[city]: https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0AqR8dXc6Ji4JdEEycENNYXQtU1RIbzRSYVRxLXFOdHc#gid=1

For historical reasons the raw data from the Country and City census arrive in different forms. We aim to get

We attempt to have a common form to the results spreadsheet.

1. Submissions - this is raw data from form submissions
2. Normalized - raw submissions data but in normalized form (standard headings)
3. Reviewed (not yet used) - reviewed and consolidated data

Country Spreadsheet
~~~~~~~~~~~~~~~~~~~

Process

1. Submit via google form
2. Arrive in submissions tab
3. Copy to the Normalized tab (which has standard columns)
4. Review (soon)

City Spreadsheet
~~~~~~~~~~~~~~~~

Process

1. Submit via our custom JS form. Data is still submitted to a google spreadsheet with a google form. However we do not use Google's generated form but just submit ourselves using JS. The form therefore only has 1 field "Data") and we store results of form as a JSON blob in this field.

2. Normalized sheet - this is produced from submissions sheet by running the unpack script (go to Open Data Census menu => Unpack)

  * uses this app script https://script.google.com/a/macros/okfn.org/d/M2ShE7x1mR_sRh_6fT27vYhyeNKfa_QZS/edit

3. Reviewed


For Developers
--------------

The app is a simple Express NodeJS app designed to be deployed on Heroku.

We have 2 main branches:

* master - development branch - deploy to <http://opendatacensus-staging.herokuapp.com/>
* production - release branch (production ready code) - deploy to <http://census.okfn.org/>

### Install

To install do the following:

1. Get the code and init the submodules (for recline vendor library)

        git clone https://github.com/okfn/opendatacensus
        git submodule init
        git submodule update

2. Install node dependencies

        cd opendatacensus
        npm install .

3. Run the app

        node app.js

4. Should now be running at <http://localhost:5000>


### Configuration

Configuration runs off lib/config.js. You can selectively override in your own
local config. To do this:

* Create `settings.json`
* Copy the config object from lib/config.js and override relevant parts. Note
  you don't need the whole object only the bits you want to change. For example:

        {
          "google": {
            "user": "xxx",
            "password": "yyy"
          }
        }

Note for Heroku you could try uploading a settings.json or take a look at
https://devcenter.heroku.com/articles/config-vars

### Running Tests

Install mocha (see devDependencies in package.json) then do:

    mocha tests/

**note** we run off live data yet some expected values are hard-coded. Thus
tests are likely to break as underlying data changes. We should fix this soon
by running off mock data.

### Deployment

We have 2 apps on Heroku:

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

