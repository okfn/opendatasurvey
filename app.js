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
    res.render('index.html', {
        numberEntries: model.data.country.summary.entries.toString(),
        numberOpen: model.data.country.summary.open.toString(),
        numberCatalogs: model.data.catalogs.records.length.toString()});
})

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
    res.render('country/index.html', {info: model.data.country});
});

app.get('/country/results.json', function(req, res) {
    res.json(model.data.country);
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

app.get('/country/overview/', function(req, res) {
    res.render('country/overview/index.html', {info: model.data.country, submissions: model.data.countrysubmissions, country: req.param('country')});
});

app.get('/country/review/', function(req, res) {
    res.render('country/review/index.html', {info: model.data.country, submissions: model.data.countrysubmissions, country: req.param('country'), dataset: req.param('dataset')});
});

app.post('/country/update/', function(req, res) {
    
    /* TODO: Only use Google's API where ncessary
     * TODO: Remove callbacks/error handling once we're certain the whole thing's working well (?)
     */

    var prevData = model.data.country.byplace[req.body['country']].datasets[req.body['dataset']];
    //Doing request and processing the body of the return with a callback:
    //http://www.sitepoint.com/web-scraping-in-node-js/    

    //The simple dataset names are not used in the spreadsheet: use this to get the complicated name
    var fulldatasetname = model.datasetNamesMap[req.body['dataset']];

    //API URLs
    //TODO: Remove URL based querying if its simpler and faster to do with the node module
    var liveUrl = model.sheetsQueryUrlMap['live'];
    var oldUrl = model.sheetsQueryUrlMap['archive'];
    var oldKey = model.sheetsQueryUrlMap['archiveKey'];
    var submitUrl = model.sheetsQueryUrlMap['submitted'];

    var returnError = {value: 0, message: ""};
    
    var liveRowToRemove = "";
    var submittedRowToRemove = "";

    //Start by getting current entry ID
    //TODO: Consider how much better/faster this is than using the node module; this way we let
    //Google do the filtering
    var theuri = liveUrl + 'dataset=%22' + fulldatasetname + '%22%20and%20place=%22' + encodeURIComponent(req.body['country']) + '%22';

    request({
        uri: theuri,
    }, function(error, response, body) {

        if (response.statusCode !== 200) {
            returnError = {value: 1, message: "While getting the current entry from the live sheet: " + response.body + "<br />No changes have taken place. You may want to <a href='../sheets/'>resolve the problem manually.</a> This error has been reported."};
            doneUpdating(returnError, req, res);
        }
        else if (body.indexOf('<entry>') === -1) {
            returnError = {value: 1, message: "There is no entry for " + req.body['dataset'] + "/" + req.body['country'] + "<br />No changes have taken place. You may want to <a href='../sheets/'>resolve the problem manually.</a> This error has been reported."};
            doneUpdating(returnError, req, res);
        }
        else if (body.indexOf('<entry>') !== body.lastIndexOf('<entry>')) {
            returnError = {value: 1, message: "There is more than one entry for " + req.body['dataset'] + "/" + req.body['country'] + "<br />No changes have taken place. You may want to <a href='../sheets/'>resolve the problem manually.</a> This error has been reported."};
            doneUpdating(returnError, req, res);
        }
        else {
            //Extract the row ID
            var entry = body.substr(body.indexOf('<entry>') + 7, (body.indexOf('</entry>') - (body.indexOf('<entry>') + 7)));
            liveRowToRemove = entry.substr(entry.indexOf('<id>') + 4, (entry.indexOf('</id>') - (entry.indexOf('<id>') + 4))); //Get it
    
            var my_sheet = new GoogleSpreadsheet(oldKey);

            // set auth to be able to edit/add/delete
            //TODO: Create Google account with no user data (sheet is open, but you need to be logged in to add) 
            my_sheet.setAuth('matt.fullerton','b0w1s123', function(err) {

                if (err) {
                    console.log(response.statusCode);
                    returnError = {value: 1, message: "While adding the current entry to the archive, could not authenticate: " + err + "<br />No changes have taken place. You may want to <a href='../sheets/'>resolve the problem manually.</a> This error has been reported."};
                    doneUpdating(returnError, req, res);
                }
                else {
                    // column names are set by google based on the first row of your sheet
                    // TODO: Move the sheet numbers out to the model
                    my_sheet.addRow( 5, {timestamp: prevData.timestamp, place: prevData.place, dataset: model.datasetNamesMap[prevData.dataset], exists: prevData.exists, digital: prevData.digital, machinereadable: prevData.machinereadable, bulk: prevData.bulk, public: prevData.public, openlicense: prevData.openlicense, uptodate: prevData.uptodate, url: prevData.url, dateavailable: prevData.dateavailable, details: prevData.details, submitter: prevData.submitter, submitterurl: prevData.submitterurl, email: prevData.email} );
                    
                    //TODO: API call to remove the row from the live data, using the ID we got earlier
                    //This is a simple query for now
                    var theuri = liveUrl + 'dataset=%22' + fulldatasetname + '%22%20and%20place=%22' + encodeURIComponent(req.body['country']) + '%22';

                    request({
                        uri: theuri,
                    }, function(error, response, body) {

                        if (response.statusCode !== 200) {
                            returnError = {value: 1, message: "While removing the current entry from the live sheet: " + response.body + "<br />The current entry is still there but has been ERRONEOUSLY copied to the archive. You should <a href='../sheets/'>resolve the problem manually.</a> This error has been reported."};
                            doneUpdating(returnError, req, res);
                        }
                        else {
                            //API call to add a row, data from the form
                            //This is a simple query for now, and we will probably do it with the node
                            //module not low level
                            var theuri = liveUrl + 'dataset=%22' + fulldatasetname + '%22%20and%20place=%22' + encodeURIComponent(req.body['country']) + '%22';

                            request({
                                uri: theuri,
                            }, function(error, response, body) {

                                if (response.statusCode !== 200) {
                                    returnError = {value: 1, message: "While trying to add the submission to the live sheet: " + response.body + "<br />The new entry has NOT been added and the existing data erroneously MOVED to the archive. Please <a href='../sheets/'>resolve manually.</a> This error has been reported."};
                                    doneUpdating(returnError, req, res);
                                }
                                else {

                                    //TODO: API call to get the ID in the submitted sheet
                                    //This is a simple query for now
                                    var theuri = submitUrl + 'dataset=%22' + fulldatasetname + '%22%20and%20censuscountry=%22' + encodeURIComponent(req.body['country']) + '%22';

                                    request({
                                        uri: theuri,
                                    }, function(error, response, body) {

                                        if (response.statusCode !== 200) {
                                            returnError = {value: 1, message: "While getting the submission to remove from the submissions sheet: " + response.body + "<br />The new entry has been added and the submission marked as reviewed but not removed from the submissions sheet. Please <a href='../sheets/'>remove it manually.</a> This error has been reported."};
                                            doneUpdating(returnError, req, res);
                                        }
                                        else if (body.indexOf('<entry>') === -1) {
                                            returnError = {value: 1, message: "There is no submission for " + req.body['dataset'] + "/" + req.body['country'] + "<br />. Your edits have been saved but the submission cannot be altered. Please <a href='../sheets/'>resolve this manually</a>. This error has been reported."};
                                            doneUpdating(returnError, req, res);
                                        }
                                        else if (body.indexOf('<entry>') !== body.lastIndexOf('<entry>')) {
                                            returnError = {value: 1, message: "There is more than one submission for " + req.body['dataset'] + "/" + req.body['country'] + ". Your edits have been saved but the submission cannot be altered. Please <a href='../sheets/'>resolve this manually</a>. This error has been reported."};
                                            doneUpdating(returnError, req, res);
                                        }
                                        else {
                                            submittedRowToRemove = ""; //Get it
                                            
                                            //TODO: API call to remove that ID from the submissions sheet using the ID we got earlier
                                            //This is a simple query for now
                                            var theuri = submitUrl + 'dataset=%22' + fulldatasetname + '%22%20and%20censuscountry=%22' + encodeURIComponent(req.body['country']) + '%22';

                                            request({
                                                uri: theuri,
                                            }, function(error, response, body) {

                                                if (response.statusCode !== 200) {
                                                    returnError = {value: 1, message: "While removing the submission from the submissions sheet: " + response.body + "<br />The new entry has been added and the submission marked as reviewed but not removed from the submissions sheet. Please <a href='../sheets/'>remove it manually.</a> This error has been reported."};
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
        }

    });

});

function doneUpdating(error, req, res) {
    if (error.value === 1) {
        //TODO: Unpack the body object
        console.log("ERROR REPORT: " + error.message + ", DATA: " + req.body);
    }

    res.render('country/overview/index.html', {info: model.data.country, submissions: model.data.countrysubmissions, country: req.body['country'], error: error});

}

app.get('/g8/', function(req, res) {
    res.render('g8/index.html', {info: model.data.g8});
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

