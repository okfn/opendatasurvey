---
layout: default
title: Deployment
---

# System Adminstration of a Census

These instructions are for Developers. It assumes you already have the code installed on your machine.

See the [README](https://github.com/okfn/opendatacensus) to get the basic setup.

## DNS

The easiest way to configure DNS settings for a Census would be to setup a wildcard entry for all subdomains of the base domain you serve from. Each site, including the `system` and `auth` sites, is served from a subdomain.

## Auth Providers

The Census is configured to use Google and Facebook as auth providers. You must setup these providers.

### Google

Go to your Google Cloud account and "Create a New Client ID" under "APIs & auth > Credentials". The type is "web application", and you need to configure the origins and callbacks for your `auth` subdomain (which is `id` by default. e.g.: `http://id.{your_domain}/login`).

Get the credentials required for your `GOOGLE_APP_ID` and `GOOGLE_APP_SECRET` settings.

### Facebook

Go to your Facebook account and add a new app. As with the Google instructions above, add the appropriate urls/callbacks for auth.

Get the credentials required for your `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET` settings.

## Deploying a New Census

If you are **not** a developer but want a Census booted please make a
request: <http://census.okfn.org/>

The census app is multi-tenant, with each tenant ("**site**") served from a subdomain.

In order to serve a site, an entry is needed in the **Registry**.

[The OKFN Registry is here](https://docs.google.com/spreadsheets/d/18jINMw7ifwUoqizc4xaQE8XtF4apPfsmMN43EM-9Pmc/edit#gid=0).

The registry no longer needs senstive information like passwords.

To start your own Census installation, copy the OK Registry and adjust as required.

Notice that each entry in the Registry has a link to the config file for the site.

This then provides the entry point into site-specific configuration.

### Before you start

IMPORTANT: to make a Google Spreadsheet 'Public on the Web' you must:

* Go to sharing and make world readable
* Go to File Menu => "Publish to the Web" and click "Start Publishing"

It's useful to check the "Automatically republish when changes are made" box. However, note that **republishing doesn't always happen immediately**. You can always revisit File Menu => "Publish to the Web" and click "Republish now".

### Step-by-Step

* Add a new entry to the Registry
* Reload the Registry on your Census at `http://{system_subdomain}.{base_domain}/control`
* Ask the Site administrator (who **must** have an email in the `adminemail` field of the Registry entry) to finish all the site-specific configuration and then the site admin must:
  * Visit `http://{site}.{base_domain}/admin`
  * Load Config
  * Load Places
  * Load Datasets
  * Load Questions
* The Site will now be live at: `http://{site}.{base_domain}/`
