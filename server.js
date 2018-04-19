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

const port = process.env.PORT || 9600;
const environment = process.env.NODE_ENV;

var dbHost = "localhost";
var dbPort = 27017;
var databaseName = "locationmotivation";
var databaseURL = 'mongodb://' + dbHost + ':' + dbPort + '/' + databaseName;

console.log("Starting server");
console.log("Server started");

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html', (err, html) => {
        if (err) {
            res.end("Not found");
        }
    });
});

app.get('/userlocations', (req, res) => {
    res.sendFile(__dirname + '/locations.html', (err, html) => {
        if (err) {
            res.end("Not found");
        }
    });
});

app.get('/goals', (req, res) => {
    res.sendFile(__dirname + '/goals.html', (err, html) => {
        if (err) {
            res.end("Not found");
        }
    });
});

app.get('/data', (req, res) => {
    res.sendFile(__dirname + '/data.html', (err, html) => {
        if (err) {
            res.end("Not found");
        }
    });
});

app.get('/location-setup', (req, res) => {
    res.sendFile(__dirname + '/location-setup.html', (err, html) => {
        if (err) {
            res.end("Not found");
        }
    });
});

app.get('/locationdata/delete', (req, res) => {
    MongoClient.connect(databaseURL, function(err, db) {
        if (err) throw err;
        var dbo = db.db("datavisproject");
        dbo.collection("location").deleteMany({}, function(err, obj) {
            if (err) throw err;
            console.log(obj.result.n + " document(s) deleted");
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(obj.result.n + " document(s) deleted"));
            db.close();
        });
    });
});

app.get('/locations/delete', (req, res) => {
    MongoClient.connect(databaseURL, function(err, db) {
        if (err) throw err;
        var dbo = db.db("datavisproject");
        dbo.collection("locations").deleteMany({}, function(err, obj) {
            if (err) throw err;
            console.log(obj.result.n + " document(s) deleted");
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(obj.result.n + " document(s) deleted"));
            db.close();
        });
    });
});

app.get('/traveling/delete', (req, res) => {
    MongoClient.connect(databaseURL, function(err, db) {
        if (err) throw err;
        var dbo = db.db("datavisproject");
        dbo.collection("traveling").deleteMany({}, function(err, obj) {
            if (err) throw err;
            console.log(obj.result.n + " document(s) deleted");
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(obj.result.n + " document(s) deleted"));
            db.close();
        });
    });
});

app.get('/locationdata', (req, res) => {
    MongoClient.connect(databaseURL, function(err, db) {
        if (err) throw err;
        var dbo = db.db("datavisproject");
        var currentLocation = dbo.collection("location").find().limit(1).sort({ $natural: -1 });
        dbo.collection("location").find({}).toArray(function(err, result) {
            if (err) throw err;
            var locationObject = [];
            for (var i in result) {
                var date = result[i]['date'];
                var time = result[i]['time'];
                var duration = result[i]['duration'];
                var name = result[i]['name'];
                var lat = result[i]['location'][0];
                var long = result[i]['location'][1];
                var item = {
                    date: date,
                    time: time,
                    name: name,
                    duration: duration,
                    lat: lat,
                    long: long
                };
                locationObject.push(item);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(locationObject));
            db.close();
        });

    });
});

app.get('/traveling', (req, res) => {
    MongoClient.connect(databaseURL, function(err, db) {
        if (err) throw err;
        var dbo = db.db("datavisproject");
        dbo.collection("traveling").find({}).toArray(function(err, result) {
            if (err) throw err;
            var coordinates = [];
            for (var i in result) {
                var lat = Number(result[i].lat);
                var long = Number(result[i].long);
                coordinates.push([lat, long]);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(coordinates));
            db.close();
        });
    });
});

app.get('/speed', (req, res) => {
    MongoClient.connect(databaseURL, function(err, db) {
        if (err) throw err;
        var dbo = db.db("datavisproject");
        dbo.collection("traveling").find({}).toArray(function(err, result) {
            if (err) throw err;
            var coordinates = [];
            for (var i in result) {
                var speed = Number(result[i].speed);
                var lat = Number(result[i].lat);
                var long = Number(result[i].long);
                for (var j = 0; j < speed; j++) {
                    coordinates.push([lat, long]);
                }
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(coordinates));
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
            var outputData = {
                type: "FeatureCollection",
                features: result
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(outputData));
            db.close();
        });
    });
});

app.get('/daystatus', (req, res) => {
    MongoClient.connect(databaseURL, function(err, db) {
        if (err) throw err;
        var dbo = db.db("datavisproject");
        dbo.collection("locations").find({}, { _id: 0, 'properties.type': 1, 'properties.duration': 1 }).toArray(function(err, result) {
            if (err) throw err;
            var positive = 0;
            var negative = 0;
            var neutral = 0;
            var total = 0;
            for (var i in result) {
                if (result[i].properties.type == "positive") {
                    positive = positive + result[i].properties.duration;
                } else if (result[i].properties.type == "negative") {
                    negative = negative + result[i].properties.duration;
                } else if (result[i].properties.type == "neutral") {
                    neutral = neutral + result[i].properties.duration;
                }
                total = total + result[i].properties.duration;
            }
            var status = {
                positive: round((positive / total), 2),
                neutral: round((neutral / total), 2),
                negative: round((negative / total), 2)
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(status));
            db.close();
        });
    });
});

app.get('/doughnutgraphdata', (req, res) => {
    MongoClient.connect(databaseURL, function(err, db) {
        if (err) throw err;
        var dbo = db.db("datavisproject");
        dbo.collection("locations").find({}).toArray(function(err, result) {
            if (err) throw err;
            var datasets = [];
            for (var i in result) {
                //add margins: must fall within 10% of goal to be green, under and over are red
                //if it goes over start a new ring in red?
                if (result[i].properties.type == "positive") {
                    if (Math.round(Number(result[i].properties.duration)) >= Math.round(Number(result[i].properties.goal))) {
                        var color = "rgba(255, 99, 132, 0.9)"; //green
                        var bordercolor = "rgba(255, 99, 132, 1)"; //greenboarder
                        var filled = Math.round(Number(result[i].properties.duration));
                        var empty = 0;
                    } else {
                        var color = "rgba(75, 220, 180, 0.9)"; //red
                        var bordercolor = "rgba(75, 220, 180, 1)"; //redboarder
                        var filled = Math.round(Number(result[i].properties.duration));
                        var empty = Math.round(Number(result[i].properties.goal)) - Math.round(Number(result[i].properties.duration));
                    }
                } else if (result[i].properties.type == "negative") {
                    //if type is negative then goal is actually a limit
                    if (Math.round(Number(result[i].properties.duration)) >= Math.round(Number(result[i].properties.goal))) {
                        var color = "rgba(255, 99, 132, 0.9)"; //red
                        var bordercolor = "rgba(255, 99, 132, 1)"; //redborder
                        var filled = Math.round(Number(result[i].properties.duration));
                        var empty = 0;
                    } else {
                        var color = "rgba(75, 220, 180, 0.9)"; //green
                        var bordercolor = "rgba(75, 220, 180, 1)"; //greenborder
                        var filled = Math.round(Number(result[i].properties.duration));
                        var empty = Math.round(Number(result[i].properties.goal)) - Math.round(Number(result[i].properties.duration));
                    }
                } else if (result[i].properties.type == "neutral") {
                    if (Math.round(Number(result[i].properties.duration)) >= Math.round(Number(result[i].properties.goal))) {
                        var color = "rgba(255, 99, 132, 0.9)"; //red
                        var bordercolor = "rgba(255, 99, 132, 1)"; //redborder
                        var filled = Math.round(Number(result[i].properties.duration));
                        var empty = 0;
                    } else {
                        var color = "rgba(54, 162, 235, 0.9)"; //blue
                        var bordercolor = "rgba(54, 162, 235, 1)"; //blueboarder
                        var filled = Math.round(Number(result[i].properties.duration));
                        var empty = Math.round(Number(result[i].properties.goal)) - Math.round(Number(result[i].properties.duration));
                    }
                }
                var dataset = {
                    data: [filled, empty],
                    backgroundColor: [color, "rgba(65, 65, 65, 0.5)"],
                    borderColor: [bordercolor, "rgba(65, 65, 65, 0.8)"],
                    borderWidth: 1,
                    label: result[i].properties.name
                }
                datasets.push(dataset);
            }
            var outputData = {
                type: 'doughnut',
                data: {
                    datasets: datasets,
                    labels: ['Time spent', 'Time remaining']
                },
                options: {
                    responsive: true,
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: "User Goals"
                    },
                    animation: {
                        duration: 1000,
                        animateScale: true,
                        animateRotate: true
                    }
                }
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(outputData));
            db.close();
        });
    });
});

app.get('/bargraphdata', (req, res) => {
    MongoClient.connect(databaseURL, function(err, db) {
        if (err) throw err;
        var dbo = db.db("datavisproject");
        dbo.collection("locations").find({}).toArray(function(err, result) {
            if (err) throw err;
            var labels = [];
            var data = [];
            var remaining = [];
            var backgroundColors = [];
            var borderColors = [];
            var remainingBackgroundColors = [];
            var remainingBackgroundBorders = [];
            for (var i in result) {
                labels.push(result[i].properties.name);
                data.push(Math.round(Number(result[i].properties.duration)));
                //backgroundColors.push(result[i].properties.color);
                borderColors.push(result[i].properties.bordercolor);
                if (Math.round(Number(result[i].properties.goal) - Number(result[i].properties.duration)) < 0) {
                    //if goal (or limit) is passed
                    if (result[i].properties.type == "positive") {
                        //changes background from red to green and any extra time added is red
                        backgroundColors.push("rgba(75, 220, 180, 0.9)"); //green
                        remainingBackgroundColors.push("rgba(255, 99, 132, 0.9)"); //red
                        remainingBackgroundBorders.push("rgba(255, 99, 132, 1)"); //red border
                    } else if (result[i].properties.type == "neutral") {
                        //leaves background blue and any extra time added is red
                        backgroundColors.push(result[i].properties.color);
                        remainingBackgroundColors.push("rgba(255, 99, 132, 0.9)"); //red
                        remainingBackgroundBorders.push("rgba(255, 99, 132, 1)"); //red border
                    } else if (result[i].properties.type == "negative") {
                        //changes background from green to red and any extra time added is red
                        backgroundColors.push("rgba(255, 99, 132, 0.9)"); //red
                        remainingBackgroundColors.push("rgba(255, 99, 132, 0.9)"); //red
                        remainingBackgroundBorders.push("rgba(255, 99, 132, 1)"); //red border
                    }
                    remaining.push(Math.round(Number(result[i].properties.duration) - Number(result[i].properties.goal)));
                } else {
                    backgroundColors.push(result[i].properties.color);
                    remainingBackgroundColors.push("rgba(255, 255, 255, 0)");
                    remainingBackgroundBorders.push(result[i].properties.color);
                    remaining.push(Math.round(Number(result[i].properties.goal) - Number(result[i].properties.duration)));
                }
            }
            //need to change labels from "remaining" to "time over" if time exceeds limit
            //change "time spent" to "time allotted" if time exceeds limit
            //need to have total time spent output
            var outputData = {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                            label: 'Time spent',
                            data: data,
                            backgroundColor: backgroundColors,
                            borderColor: borderColors,
                            borderWidth: 1
                        },
                        {
                            label: 'Remaining',
                            data: remaining,
                            backgroundColor: remainingBackgroundColors,
                            borderColor: remainingBackgroundBorders,
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            },
                            stacked: true
                        }],
                        xAxes: [{
                            stacked: true
                        }]
                    },
                    animation: {
                        duration: 1000
                    }
                }
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(outputData));
            db.close();
        });
    });
});

app.post('/locationdata', function(req, res) {
    MongoClient.connect(databaseURL, function(err, db) {
        if (err) throw err;
        console.log("Received data:");
        var dbo = db.db("datavisproject");
        var lastLocation = dbo.collection("location").find().limit(1).sort({ $natural: -1 });
        lastLocation.toArray(function(err, results) {
            if (err) throw err;
            //console.log("Last location:")
            //console.log('%j', results);
            var ctime = (new Date).getTime();
            var stime = String(new Date().timeNow());
            var sdate = String(new Date().today());
            var speed = Number(req.body.speed);
            var x = Number(req.body.long);
            var y = Number(req.body.lat);
            if (speed < 0) {
                speed = 0;
            }
            var currentLocationName = "unknown"; //just a placeholder
            if (results.length == 0) {
                var elapsedTime = 65;
                var lastLocationName = "none";
                var totalTime = 0;
                var lastDuration = 0;
                var lastID = 0;
            } else {
                var currentEpoch = (new Date).getTime();
                var lastDataEpoch = results[0].epoch;
                var elapsedTime = (currentEpoch - lastDataEpoch) / 1000;
                var lastID = results[0]._id;
                var lastLocationName = results[0].name;
                var lastDuration = results[0].duration;
            }
            dbo.collection("locations").find({}).toArray(function(err, result) {
                if (err) throw err;
                for (var i in result) {
                    var name = result[i].properties.name;
                    var totalLocationDuration = Number(result[i].properties.duration);
                    var northwest = result[i].geometry.coordinates[0][0];
                    var southeast = result[i].geometry.coordinates[0][2];
                    var top = northwest[1];
                    var bottom = southeast[1];
                    var left = northwest[0];
                    var right = southeast[0];
                    if (bottom > top) {
                        top = southeast[1];
                        bottom = northwest[1];
                    }
                    if (left > top) {
                        right = northwest[0];
                        left = southeast[0];
                    }
                    if (speed > 6) {
                        console.log("currently traveling " + speed + " m/s");
                        currentLocationName = "Traveling";
                        dbo.collection("traveling").insertOne({ lat: req.body.lat, long: req.body.long, speed: speed }, function(err, res) {
                            if (err) throw err;
                            console.log("New traveling entry");
                            console.log("Coordinates: " + req.body.lat + ", " + req.body.long);
                            console.log("Speed: " + speed);
                            console.log("Data saved");
                            console.log('------------------------------------------------');
                            db.close();
                        });
                    } else {
                        if (x < right && x > left && y > bottom && y < top) {
                            currentLocationName = name;
                            //add elapsed time to location duration

                            var newTotalDuration = totalLocationDuration + (elapsedTime / 60);
                            dbo.collection("locations").updateOne({ 'properties.name': currentLocationName }, { $set: { 'properties.duration': newTotalDuration } }, function(err, res) {
                                if (err) throw err;
                            });
                        }
                    }
                }
                if (currentLocationName != lastLocationName) {
                    //add elapsed time to last db item
                    //create a new db item with new location and totalTime = 0
                    console.log("Location has changed");
                    if (lastID != 0) {
                        var totalTime = Number(lastDuration + elapsedTime);
                        dbo.collection("location").updateOne({ _id: lastID }, { $set: { epoch: ctime, speed: speed, date: sdate, time: stime, duration: totalTime } }, function(err, res) {
                            if (err) throw err;
                            console.log("Updating database entry");
                            console.log("Last location: " + lastLocationName);
                            console.log("Seconds since last post: " + elapsedTime);
                            console.log("Total time in location: " + totalTime);
                            console.log("Data updated");
                            console.log('------------------------------------------------');
                            var newLocationObj = {
                                epoch: ctime,
                                speed: speed,
                                date: sdate,
                                time: stime,
                                duration: 0,
                                name: currentLocationName,
                                location: [Number(req.body.lat), Number(req.body.long)]
                            };
                            dbo.collection("location").insertOne(newLocationObj, function(err, res) {
                                if (err) throw err;
                                console.log("New database entry");
                                console.log("New location: " + currentLocationName);
                                console.log("Total time in new location: 0");
                                console.log("Data saved");
                                console.log('------------------------------------------------');
                                db.close();
                            });
                        });
                    } else {
                        //if lastID is 0 then this is the first post to the db (db is empty)
                        console.log("No previous location results found");
                        var newLocationObj = {
                            epoch: ctime,
                            speed: speed,
                            date: sdate,
                            time: stime,
                            duration: 0,
                            name: currentLocationName,
                            location: [Number(req.body.lat), Number(req.body.long)]
                        };
                        dbo.collection("location").insertOne(newLocationObj, function(err, res) {
                            if (err) throw err;
                            console.log("New database entry");
                            console.log("Location: " + currentLocationName);
                            console.log("Total time in new location: 0");
                            console.log("Data saved");
                            console.log('------------------------------------------------');
                            db.close();
                        });
                    }
                } else {
                    console.log("Location has not changed");
                    var totalTime = Number(lastDuration + elapsedTime);
                    dbo.collection("location").updateOne({ _id: lastID }, { $set: { epoch: ctime, speed: speed, date: sdate, time: stime, duration: totalTime } }, function(err, res) {
                        if (err) throw err;
                        console.log("Updating database entry");
                        console.log("Current location: " + currentLocationName);
                        console.log("Seconds since last post: " + elapsedTime);
                        console.log("Total time in location: " + totalTime);
                        console.log("Data updated");
                        console.log('------------------------------------------------');
                        db.close();
                    });
                }
            });
        });
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('ok');
    });
});

app.post('/locations', function(req, res) {
    console.log("Received new location");
    //{ lat: '28.046096', long: '-80.605957', radius: '100', name: 'Home', type: "neutral", goal: '180' }//goal in minutes
    //{ lat: '28.0782985', long: '-80.609079', radius: '100', name: 'Main Street Pub', type: "negative", goal: '90' }
    //{ lat: '28.065764', long: '-80.622849', radius: '200', name: 'Evans Library', type: "positive", goal: '30' }
    var pi = 3.14159265359;
    var r_earth = 6378;
    var latitude = Number(req.body.lat);
    var longitude = Number(req.body.long);
    var new_center = [Number(req.body.long), Number(req.body.lat)];
    var radius = Number(req.body.radius / 1000);

    var n_latitude = Number(latitude + (radius / r_earth) * (180 / pi));
    var s_latitude = Number(latitude - (radius / r_earth) * (180 / pi));
    var e_longitude = Number(longitude + (radius / r_earth) * (180 / pi) / Math.cos(latitude * pi / 180));
    var w_longitude = Number(longitude - (radius / r_earth) * (180 / pi) / Math.cos(latitude * pi / 180));

    var result = {
        name: req.body.name,
        type: req.body.type,
        goal: Number(req.body.goal),
        center: [Number(req.body.long), Number(req.body.lat)],
        northwest: [Number(w_longitude), Number(n_latitude)],
        northeast: [Number(e_longitude), Number(n_latitude)],
        southwest: [Number(w_longitude), Number(s_latitude)],
        southeast: [Number(e_longitude), Number(s_latitude)]
    }
    console.log(result);

    var name = result['name'];
    var type = result['type'];
    var goal = result['goal'];
    if (type == "positive") {
        var color = "rgba(255, 99, 132, 0.9)";
        var bordercolor = "rgba(255, 99, 132, 1)";
    } else if (type == "neutral") {
        var color = "rgba(54, 162, 235, 0.9)";
        var bordercolor = "rgba(54, 162, 235, 1)";
    } else if (type == "negative") {
        var color = "rgba(75, 220, 180, 0.9)";
        var bordercolor = "rgba(75, 220, 180, 1)";
    }
    var center = result['center'];
    var northwest = result['northwest'];
    var northeast = result['northeast'];
    var southwest = result['southwest'];
    var southeast = result['southeast'];
    var location = {
        type: "Feature",
        geometry: {
            type: "Polygon",
            coordinates: [
                [
                    northwest,
                    northeast,
                    southeast,
                    southwest,
                    northwest
                ]
            ]
        },
        properties: {
            name: name,
            type: type,
            center: center,
            duration: 0,
            goal: goal,
            color: color,
            bordercolor: bordercolor
        }
    };

    MongoClient.connect(databaseURL, function(err, db) {
        if (err) throw err;
        var dbo = db.db("datavisproject");
        dbo.collection("locations").insertOne(location, function(err, res) {
            if (err) throw err;
            console.log("Data saved");
            console.log('------------------------------------------------');
            db.close();
        });
    });
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('ok');
});

app.post('/locations-command', function(req, res) {
    console.log("Received new location command");
    console.log(req.body);
    if (req.body.command == "remove") {
        MongoClient.connect(databaseURL, function(err, db) {
            if (err) throw err;
            var dbo = db.db("datavisproject");
            var id = require('mongodb').ObjectID(req.body.id);
            var myquery = { '_id': id };
            dbo.collection("locations").deleteOne(myquery, function(err, obj) {
                if (err) throw err;
                console.log("Location removed");
                console.log('------------------------------------------------');
                db.close();
            });
        });
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('ok');
    } else if (req.body.command == "edit") {
        MongoClient.connect(databaseURL, function(err, db) {
            if (err) throw err;
            var dbo = db.db("datavisproject");
            var id = require('mongodb').ObjectID(req.body.id);
            var myquery = { '_id': id };
            var newvalues = { $set: { 'properties.name': req.body.name, 'properties.type': req.body.type, 'properties.goal': req.body.goal } };
            dbo.collection("locations").updateOne(myquery, newvalues, function(err, res) {
                if (err) throw err;
                console.log("Location updated");
                console.log('------------------------------------------------');
                db.close();
            });
        });
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('ok');
    } else {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end('command not found');
    }


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
    console.log("Waiting for data...");
    console.log('------------------------------------------------');
});

function round(value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

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