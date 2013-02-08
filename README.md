Open Data Census Dashboard
==========================

Visualizations and data procesing for the [Open Data Census][].

[Open Data Census]: http://census.okfn.org/

This also includes various ancillary information providing an overview of what
is happening with release of open government data around the world (and
initiatives related to it).

Materials
---------

* [Open Data Census folder in Google Docs](https://drive.google.com/a/okfn.org/#folders/0B6R8dXc6Ji4JTWE0TVhFejYza2c)
* [Original User Stories][stories]
* [Census Questions Spreadshet](https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc#gid=0)
* DataHub Dataset: <http://datahub.io/dataset/open-data-census>

[stories]: https://docs.google.com/document/d/1Ji2pifZYSggdgp0Pe8s_vFNrZIvrgwB1OhYz0AdkGsc/edit

For Developers
--------------

It's just HTML + JS but you'll need to initialize the submodules to get relevant dependencies:

    git submodule init
    git submodule update


Plan
----

Data Sources
............

* Open data census http://opengovernmentdata.org/census
* http://datacatalogs.org
* Dataset Counts (create Google Doc)
* Timeline of History of OGD related events
* OG Partnership Signatories


Views
-----

Front Page: Big numbers!
........................
* Top Countries
* Percentage of key datasets available
* Number of Countries in OGP
* No of Datasets
* No of Data Catalogs

/census/
........

* Per country count of open important datasets
* Per country count of total datasets
* Per Dataset for Country
    * Per country counts with Y in the census

Pages:

* Choropleth mapof the view above
    * Ability to switch between views
* Bar graph summary of datasets
* Table Summary
* About 


Data catalogs /catalogs/
........................

* Searchable Map
* Timeline

Open Government Partnership /ogp/
.................................

Low priority

