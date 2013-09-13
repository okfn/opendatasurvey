var express = require('express')
        , path = require('path')
        , fs = require('fs')
        , nunjucks = require('nunjucks')
        , request = require('request')
        , csv = require('csv')
        , GoogleSpreadsheet = require('google-spreadsheet')
        , _ = require('underscore')
        ;

var app = express();

var model = require('./models/country.js').OpenDataCensus;

//NODE.JS AND EXPRESS - SESSIONS - http://blog.modulus.io/nodejs-and-express-sessions
app.use(express.cookieParser());
app.use(express.session({secret: 'wpbmzky%js,$#jsmdvgas'}));

//CORS middleware
var CORSSupport = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
}

app.configure(function() {
    app.set('port', process.env.PORT || 50000);
    app.set('views', __dirname + '/templates');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(CORSSupport);
    app.use(express.static(path.join(__dirname, 'public')));
});

var env = new nunjucks.Environment(new nunjucks.FileSystemLoader('templates'));
env.express(app);

// middleware to add trailing slash
/*
 app.use(function(req, res, next) {
 if(req.url.substr(-1) != '/' && req.url.indexOf('.') == -1) {
 res.redirect(301, req.url + '/');
 }
 else {
 next();
 }
 });
 */

app.get('/', function(req, res) {
    //model.load(function() { //Don't reload for the public
    res.render('index.html', {
        numberEntries: model.data.country.summary.entries.toString(),
        numberOpen: model.data.country.summary.open.toString(),
        numberCatalogs: model.data.catalogs.records.length.toString()});
//});
});

app.get('/about/', function(req, res) {
    fs.readFile('templates/about.md', 'utf8', function(err, text) {
        var marked = require('marked');
        var content = marked(text);
        res.render('base.html', {
            content: content,
            title: 'About'
        });
    });
});

app.get('/contribute/', function(req, res) {
    fs.readFile('templates/contribute.md', 'utf8', function(err, text) {
        var marked = require('marked');
        var content = marked(text);
        res.render('base.html', {
            content: content,
            title: 'Contribute'
        });
    });
});

app.get('/country/', function(req, res) {
    //model.load(function() { //Don't reload for the public
        res.render('country/index.html', {info: model.data.country});
    });
//});

app.get('/country/results.json', function(req, res) {
    model.load(function() { //Get latest data
        res.json(model.data.country);
});
});

//This messes up URL arguments, removing for now
/*
 app.get('/country/remove', function(req, res) {
 //var country = req.param('country');
 //var dataset = req.param('dataset');
 remove('submitted', req);
 });
 */

app.get('/country/submit/', function(req, res) {
    res.render('country/submit/index.html', {datasetsmap: model.datasetNamesMap, dataset: req.param('dataset')});
});

//"Log In" page
app.get('/country/reviewers/', function(req, res) {
    res.render('country/reviewers/index.html', {countries: model.data.countrysubmissions.places, country: req.param('country') });
});

//Show the spreadsheet data, only for reviewers
app.get('/country/sheets/', function(req, res) {
    if (req.session.loggedin) res.render('country/sheets/index.html', { });
    else res.render('country/reviewers/index.html', {countries: model.data.countrysubmissions.places, error: "Only reviewers can access that page" });
});

//Show details per country. Extra/different functionality for reviewers.
app.get('/country/overview/', function(req, res) {
    model.load(function() { //Get latest data, even for the public; they should see their entries awaiting approval
    res.render('country/overview/index.html', {info: model.data.country, submissions: model.data.countrysubmissions, country: req.param('country'), loggedin: req.session.loggedin});
});
});

//Compare & update page
app.get('/country/review/', function(req, res) {
    if (req.session.loggedin) {
        model.load(function() { //Get latest data
        res.render('country/review/index.html', {info: model.data.country, submissions: model.data.countrysubmissions, country: req.param('country'), dataset: req.param('dataset')});
        });
    }
    else res.render('country/reviewers/index.html', {countries: model.data.countrysubmissions.places, country: req.param('country'), error: "Only reviewers can access that page" });
});

app.get('/country/logout/', function(req, res) {
        req.session.loggedin = false;
        res.render('country/index.html', {info: model.data.country});
});

app.post('/country/authenticate/', function(req, res) {
    if (req.body['password'] === "notagoodpassword") {
        req.session.loggedin = true;
        model.load(function() { //Get latest data
        res.render('country/overview/index.html', {info: model.data.country, submissions: model.data.countrysubmissions, country: req.body['country']});
        });
    }
    else res.render('country/reviewers/index.html', {countries: model.data.countrysubmissions.places, error: "Password incorrect" });
});

app.post('/country/update/', function(req, res) {

    if (!req.session.loggedin) {
        res.render('country/reviewers/index.html', {countries: model.data.countrysubmissions.places, country: req.param('country'), error: "Only reviewers can access that page" });
    return;
    }
    /* 
     * This uses the Google-Spreadsheets module
     * 
     * We first copy the current data to the archive,
     * then modify the current data,
     * then delete the submission.
     * 
     */

    //The simple dataset names are not used in the spreadsheet: use this to get the complicated name
    var fulldatasetname = model.datasetNamesMap[req.body['dataset']];

    //Key for the spreadsheet (see country.js)
    var gKey = model.sheetsQueryUrlMap['key'];

    //Feedback
    var returnError = {value: 0, message: ""};

    var my_sheet = new GoogleSpreadsheet(gKey);
    //We need authentication to perform edits(?) 
    //TODO: Create Google account with no user data (sheet is open, but you need to be logged in to add(?)) 
    my_sheet.setAuth('matt.fullerton', 'r0njasgr8', function(err) {
        if (err) {
            returnError = {value: 1, message: "Could not authenticate: " + err + "<br />No changes have taken place. You may want to <a href='../sheets/'>resolve the problem manually.</a> This error has been reported."};
            doneUpdating(returnError, req, res);
        }
        else {
            //Start by getting current entry. Module was modified to accept a query so that we don't have to download the whole sheet :)
            var query = {};
            query["sq"] = 'dataset="' + fulldatasetname + '" and place="' + encodeURIComponent(req.body['country']) + '"';

            //Get the (unique) row
            my_sheet.getRows(3, {}, query, function(err, rows) {
                if (err) {
                    returnError = {value: 1, message: "While getting the current entry from the live sheet: " + err + "<br />No changes have taken place. You may want to <a href='../sheets/'>resolve the problem manually.</a> This error has been reported."};
                    doneUpdating(returnError, req, res);
                }
                else if (rows.length === 0) {
                    returnError = {value: 1, message: "There is no entry for " + req.body['dataset'] + "/" + req.body['country'] + "<br />No changes have taken place. You may want to <a href='../sheets/'>resolve the problem manually.</a> This error has been reported."};
                    doneUpdating(returnError, req, res);
                }
                else if (rows.length > 1) {
                    returnError = {value: 1, message: "There is more than one entry for " + req.body['dataset'] + "/" + req.body['country'] + "<br />No changes have taken place. You may want to <a href='../sheets/'>resolve the problem manually.</a> This error has been reported."};
                    doneUpdating(returnError, req, res);
                }
                else {
                    //Copy the data to the archive
                    my_sheet.addRow(5, {timestamp: rows[0].timestamp, place: rows[0].place, dataset: rows[0].dataset, exists: rows[0].exists, digital: rows[0].digital, machinereadable: rows[0].machinereadable, bulk: rows[0].bulk, public: rows[0].public, openlicense: rows[0].openlicense, uptodate: rows[0].uptodate, url: rows[0].url, dateavailable: rows[0].dateavailable, details: rows[0].details, submitter: rows[0].submitter, submitterurl: rows[0].submitterurl, email: rows[0].email, reviewed: rows[0].reviewed, archived: timeStamp()});

                    //Modify the row with the new data
                    rows[0].timestamp = req.body['timestamp'];
                    //rows[0].place = //Don't change!
                    //rows[0].dataset = //Don't change!
                    rows[0].exists = req.body['exists'];
                    rows[0].digital = req.body['digital'];
                    rows[0].machinereadable = req.body['machinereadable'];
                    rows[0].bulk = req.body['bulk'];
                    rows[0].public = req.body['public'];
                    rows[0].openlicense = req.body['openlicense'];
                    rows[0].uptodate = req.body['uptodate'];
                    rows[0].url = req.body['url'];
                    rows[0].dateavailable = req.body['dateavailable'];
                    rows[0].details = req.body['details'];
                    rows[0].submitter = req.body['submitter'];
                    rows[0].submitterurl = req.body['submitterurl'];
                    rows[0].email = req.body['email'];
                    rows[0].reviewed = 'Via web interface on ' + timeStamp();

                    rows[0].save(function(err) {
                        if (err) {
                            returnError = {value: 1, message: "While modifying the current entry in the live sheet: " + err + "<br />The current entry is still there but has been ERRONEOUSLY copied to the archive. You should <a href='../sheets/'>resolve the problem manually.</a> This error has been reported."};
                            doneUpdating(returnError, req, res);
                        }
                        else {

                            //Get the row in the submitted sheet
                            var query = {};
                            query["sq"] = 'dataset="' + fulldatasetname + '" and censuscountry="' + encodeURIComponent(req.body['country']) + '"';

                            //Get the (unique) row
                            my_sheet.getRows(1, {}, query, function(err, srows) {

                                if (err) {
                                    returnError = {value: 1, message: "While getting the submission to remove from the submissions sheet: " + err + "<br />The new entry has been added and the submission marked as reviewed but not removed from the submissions sheet. Please <a href='../sheets/'>remove it manually.</a> This error has been reported."};
                                    doneUpdating(returnError, req, res);
                                }
                                else if (srows.length === 0) {
                                    returnError = {value: 1, message: "There is no submission for " + req.body['dataset'] + "/" + req.body['country'] + "<br />. Your edits have been saved but the submission cannot be altered. Please <a href='../sheets/'>resolve this manually</a>. This error has been reported."};
                                    doneUpdating(returnError, req, res);
                                }
                                else if (srows.length > 1) {
                                    returnError = {value: 1, message: "There is more than one submission for " + req.body['dataset'] + "/" + req.body['country'] + ". Your edits have been saved but the submission cannot be altered. Please <a href='../sheets/'>resolve this manually</a>. This error has been reported."};
                                    doneUpdating(returnError, req, res);
                                }
                                else {
                                    srows[0].del(function(err) {

                                        if (err) {
                                            returnError = {value: 1, message: "While removing the submission from the submissions sheet: " + err + "<br />The new entry has been added and the submission marked as reviewed but not removed from the submissions sheet. Please <a href='../sheets/'>remove it manually.</a> This error has been reported."};
                                            doneUpdating(returnError, req, res);
                                        }
                                        else {
                                            returnError = {value: 0, message: "Entry updated successfully. The old entry has been archived and the submission marked as reviewed. Thank you!"};
                                            doneUpdating(returnError, req, res);
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

function doneUpdating(error, req, res) {
    if (error.value === 1) {
        console.log("ERROR REPORT: " + error.message + ", DATA: ");
        console.log(req.body);
    }
   model.load(function() { //Get latest data
    res.render('country/overview/index.html', {info: model.data.country, submissions: model.data.countrysubmissions, country: req.body['country'], error: error});
     });
}

/**
 * Return a timestamp with the format "m/d/yy h:MM:ss TT"
 * @type {Date}
 * https://gist.github.com/hurjas/2660489
 */

function timeStamp() {
// Create a date object with the current time
    var now = new Date();

// Create an array with the current month, day and time
    var date = [now.getDate(), now.getMonth() + 1, now.getFullYear()];

// Create an array with the current hour, minute and second
    var time = [now.getHours(), now.getMinutes(), now.getSeconds()];

// If seconds and minutes are less than 10, add a zero
    for (var i = 1; i < 3; i++) {
        if (time[i] < 10) {
            time[i] = "0" + time[i];
        }
    }

// Return the formatted string
    return date.join("/") + " " + time.join(":");
}

app.get('/g8/', function(req, res) {
    //model.load(function() { //Don't reload for the public
    res.render('g8/index.html', {info: model.data.g8});
    
    //});
});

app.get('/city/', function(req, res) {
    res.render('city/index.html', {info: model.data.city});
});

app.get('/city/results.json', function(req, res) {
    res.json(model.data.city);
});

app.get('/city/submit/', function(req, res) {
    res.render('city/submit/index.html', {});
});

app.get('/catalogs/', function(req, res) {
    res.render('catalogs/index.html', {});
});

// var url = process.env.CATALOG_URL|| CATALOG_URL_DEFAULT;
// var catalog = new model.Catalog();

model.load(function(err) {
    if (err) {
        console.error('Failed to load dataset info');
    }
    app.listen(app.get('port'), function() {
        console.log("Listening on " + app.get('port'));
    });
});

