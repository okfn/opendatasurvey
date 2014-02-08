## Administrator Config

These are the config variables you can set in your primary config spreadsheet
(CSV file).

Those marked with a (*) must be set.

Here is an [example config spreadsheet][ex] used for testing.

[ex]: https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0AqR8dXc6Ji4JdEg2el9xaUxBcjFnbEYtNnMwLTVmTVE&usp=drive_web#gid=2

### title

Site title - used on the website etc

### title_short

Short version of the title

### display_year

Year to display information about.

Default is 2014.

### submit_year

Default year to collect information about.

Default is 2014.

### reviewers

List of reviewer user ids separated by spaces or commas. Reviewer user ids should be of form facebook:{facebook-username}

### database_spreadsheet_key (*)

The key of a Google docs spreadsheet.

### datasets

URL to an online CSV file containing a list of datasets to ask questions about. The structure should follow that in https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc&usp=drive_web#gid=0
### places

URL to an online CSV file containing a list of places to ask questions about. The structure should follow that in https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc&usp=drive_web#gid=7
### questions

URL to a CSV file with a list of questions (usually this will be the CSV version of a google spreadsheet).

We STRONGLY recommend using questions as in https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc&usp=drive_web#gid=1"

