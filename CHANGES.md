# Code

Note: we haven't yet really done proper releases or tagging.

## v3.1

* Translation

## v3.0 - February 2014

Key focus of this release was to enable deployment and management of many
"custom" censuses 

[Github Milestone](https://github.com/okfn/opendatacensus/issues?milestone=5&state=closed)

* Major internal code upgrade and refactor to support multiple instances
* User authentication and separate user database
* Core config in spreadsheet for easy administration

## v2.1 - October 2014

Focus of this release was frontend presentation.

[Github Milestone](https://github.com/okfn/opendatacensus/issues?milestone=3&state=closed)

## v2.0 - October 2014

----

# Database

## Database v3 - Feb 18 2014

Code Release: v3

Code SHA: ac2aca9c1a08cde12c307166887693e9f3d4aa4f (last related commit)

See also 97bee55339ecd4a50985d8d843817cb01312d768 for fields other than censusid.

Introduction of fields to Submission table:

* censusid
* licenseurl
* title
* publisher
* qualityinfo
* qualitystructure

Repurpose submitterid. Existing submitterid values are no longer valid so you
MUST move any existing submitterid column to e.g. submitterid_old and introduce
new submitterid column (note we do not use submitterid yet so nothing will
break right now if you don't do this but will cause problems in the future).

Introduction of fields to Entries table:

* censusid
* licenseurl
* title
* publisher
* qualityinfo
* qualitystructure

## Database v2

## Database v1

