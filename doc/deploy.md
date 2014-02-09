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


### TODO

Document key config that needs to be set e.g.

* site_url
* configUrl


