const compress = require('compression');
const express = require('express');
const path = require('path');
const fs = require('fs');
const util = require('util');
const request = require('request');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const sys = require('util');
const exec = require('child_process').exec;
const bodyParser = require('body-parser');

const app = express();
app.use(cors())
app.disable('etag');
app.use(compress());
app.use('/', express.static(path.join(__dirname)));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = process.env.PORT || 3000;
const environment = process.env.NODE_ENV;

var dbHost = "localhost";
var dbPort = 27017;
var databaseName = "locationmotivation";
var databaseURL = 'mongodb://' + dbHost + ':' + dbPort + '/' + databaseName;

console.log("Starting server");
console.log("Server started");

console.log("Waiting for data...");
console.log('------------------------------------------------');

app.get('/delete/locationdata', (req, res) => {
    MongoClient.connect(databaseURL, function(err, db) {
        if (err) throw err;
        var dbo = db.db("datavisproject");
        var myquery = {};
        db.collection("locationdata").deleteMany(myquery, function(err, obj) {
            if (err) throw err;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(obj.result.n + " document(s) deleted");
            db.close();
        });
    });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html', (err, html) => {
        if (err) {
            res.end("Not found");
        }
    });
});

app.get('/locationdata', (req, res) => {
    MongoClient.connect(databaseURL, function(err, db) {
        if (err) throw err;
        var dbo = db.db("datavisproject");
        dbo.collection("location").find({}).toArray(function(err, result) {
            if (err) throw err;
            var locationObject = [];
            for (var i in result) {
                var date = result[i]['date'];
                var time = result[i]['time'];
                var lat = result[i]['location'][0];
                var long = result[i]['location'][1];
                var item = { date: date, time: time, lat: lat, long: long };
                locationObject.push(item);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(locationObject));
            db.close();
        });
    });
});

app.get('/locations', (req, res) => {
    MongoClient.connect(databaseURL, function(err, db) {
        if (err) throw err;
        var dbo = db.db("datavisproject");
        dbo.collection("locations").find({}).toArray(function(err, result) {
            if (err) throw err;
            var locationObject = [];
            for (var i in result) {
                var locationName = result[i]['name'];
                var lat = result[i]['location'][0];
                var long = result[i]['location'][1];
                var radius = result[i]['radius'];
                var item = { name: locationName, radius: radius, lat: lat, long: long };
                locationObject.push(item);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(locationObject));
            db.close();
        });
    });
});

app.post('/locationdata', function(req, res) {
    console.log("Received data:");
    console.log(req.body);

    MongoClient.connect(databaseURL, function(err, db) {
        if (err) throw err;
        var dbo = db.db("datavisproject");
        var ctime = (new Date).getTime();
        var stime = String(new Date().timeNow());
        var sdate = String(new Date().today());
        var newObj = {
            epoch: ctime,
            date: sdate,
            time: stime,
            location: [Number(req.body.lat), Number(req.body.long)]
        };
        console.log(newObj);
        dbo.collection("location").insertOne(newObj, function(err, res) {
            if (err) throw err;
            console.log("Data saved");
            console.log('------------------------------------------------');
            db.close();
        });
    });
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('ok');
});

app.post('/locations', function(req, res) {
    console.log("Received data:");
    console.log(req.body);

    MongoClient.connect(databaseURL, function(err, db) {
        if (err) throw err;
        var dbo = db.db("datavisproject");
        var newObj = {
            name: req.body.name,
            radius: req.body.radius,
            location: [Number(req.body.lat), Number(req.body.long)]
        };
        console.log(newObj);
        dbo.collection("locations").insertOne(newObj, function(err, res) {
            if (err) throw err;
            console.log("Data saved");
            console.log('------------------------------------------------');
            db.close();
        });
    });
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('ok');
});

app.get('*', function(req, res) {
    res.sendFile(__dirname + '/404.jpg', (err, html) => {
        if (err) {
            res.end("Not found");
        }
    });
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

// For todays date;
Date.prototype.today = function() {
    return (((this.getMonth() + 1) < 10) ? "0" : "") + (this.getMonth() + 1) + "/" + ((this.getDate() < 10) ? "0" : "") + this.getDate() + "/" + this.getFullYear();
}

// For the time now
Date.prototype.timeNow = function() {
    var currentHour = Number(((this.getHours() < 10) ? "0" : "") + this.getHours());
    var ampm = 'AM';
    if (currentHour > 12) {
        currentHour = currentHour - 12;
        ampm = 'PM';
    }
    return currentHour + ":" + ((this.getMinutes() < 10) ? "0" : "") + this.getMinutes() + ":" + ((this.getSeconds() < 10) ? "0" : "") + this.getSeconds() + ' ' + ampm;
}
