var session = require('express-session');
//var sharedsession = require("express-socket.io-session");
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var assert = require('assert');

var mongodb = require('mongodb');

var password = require('password-hash-and-salt');

var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({limit: '5mb'}));

app.set('view engine', 'ejs');

app.use(session({secret: 'ksljflksdfj',
                resave: false,
                saveUninitialized: false}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, '/../public')));

app.use(express.static(path.join(__dirname, '/../views')));
console.log(__dirname + '/../public');


// -------         INCLUDES          -------- //

app.use('/', require("./routes"));

// ------------------------------------------ //

app.post('/login', function (req, res) {

  mongodb.MongoClient.connect("mongodb://localhost:27017/matcha", function(err, db) {
    assert.equal(null, err);
    assert.ok(db != null);
    db.collection("users").findOne({username: req.body.username}, {password: 1, _id: 0}, function(err, doc) {
      if (err)
          throw new Error('Something went wrong!');
      if (!doc) {
        res.render(__dirname + '/../views/templates/index.ejs',
          {alert: true,
          alert_type: "alert-warning",
          alert_msg: "<strong>Warning !</strong> Bad username."});
          return;
      }
      password(req.body.password).verifyAgainst(doc.password, function(error, verified) {
         if (error)
             throw new Error('Something went wrong!');
         if (!verified) {
           res.render(__dirname + '/../views/templates/index.ejs',
             {alert: true,
             alert_type: "alert-warning",
             alert_msg: "<strong>Warning !</strong> Wrong password."});
             return;
         } else {
          req.session.username = req.body.username;
          res.redirect('/');
          return;
         }
      });
    });
  });
});

app.post('/profile', function (req, res) {
  mongodb.MongoClient.connect("mongodb://localhost:27017/matcha", function(err, db) {
    assert.equal(null, err);
    assert.ok(db != null);
    switch (req.body.field) {
      case "email":
        db.collection("users").update(
          {username: req.session.username},
          {$set: {email: req.body.content}},
          { upsert : true }
        );
        break;
      case "biography":
        db.collection("users").update(
          {username: req.session.username},
          {$set: {biography: req.body.content}},
          { upsert : true }
        );
        break;
      case "gender":
        db.collection("users").update(
          {username: req.session.username},
          {$set: {gender: req.body.content}},
          { upsert : true }
        );
        break;
      case "sex_pref":
        db.collection("users").update(
          {username: req.session.username},
          {$set: {sex_pref: req.body.content}},
          { upsert : true }
        );
        break;
      case "interests":
        db.collection("users").update(
          {username: req.session.username},
          {$set: {interests: req.body.content}},
          { upsert : true }
        );
        break;
      case "firstname":
        db.collection("users").update(
          {username: req.session.username},
          {$set: {firstname: req.body.content}},
          { upsert : true }
        );
        break;
      case "lastname":
        db.collection("users").update(
          {username: req.session.username},
          {$set: {lastname: req.body.content}},
          { upsert : true }
        );
        break;
      case "age":
        if (isNaN(req.body.content) || req.body.content < 18 || req.body.content > 120)
          res.json({status: 500, message : "Age not valid"});
        else
          db.collection("users").update(
            {username: req.session.username},
            {$set: {age: req.body.content}},
            { upsert : true }
          );
        break;
      case "picture":
        var obj = {};
        var field = 'picture' + req.body.index;
        obj[field] = req.body.content;

        db.collection("users").update(
          {username: req.session.username},
          {$set: obj},
          { upsert : true }
        );
        break;
      case "profile_pic":
        db.collection("users").update(
          {username: req.session.username},
          {$set: {profile_pic: req.body.content}},
          { upsert : true }
        );
        break;
      case "location":
        db.collection("users").update(
          {username: req.session.username},
          {$set: {location: req.body.content}},
          { upsert : true }
        );
        break;
      case "lat_lng":
        db.collection("users").update(
          {username: req.session.username},
          {$set: {lat_lng: req.body.content}},
          { upsert : true }
        );
        break;
      case "like":
        db.collection("users").findOne(
          {username: req.session.username},
          {like: 1},
          function(err, user) {
            if (user.like && user.like.indexOf(req.body.content) !== -1) {
              db.collection("users").update(
                {username: req.session.username},
                {$pull: {like: req.body.content}}
              );
            } else {
              db.collection("users").update(
                {username: req.session.username},
                {$push: {like: req.body.content}},
                { upsert : true }
              );
            }
          });
        break;
    }
  });
});

app.post('/register', function (req, res) {
  var username = req.body.username,
  email = req.body.email,
  firstname = req.body.firstname,
  lastname = req.body.lastname,
  pass = req.body.password;

  if (pass !== req.body['confirm-password']) {
    res.render(__dirname + '/../views/templates/index.ejs',
      {alert: true,
      alert_type: "alert-warning",
      alert_msg: "<strong>Warning !</strong> Password confirmation and password are different."});
      return;
  }

  if (pass < 6
      || !/[a-z]/.test(pass)
      || !/[A-Z]/.test(pass)
      || !/[0-9]/.test(pass)) {
    res.render(__dirname + '/../views/templates/index.ejs',
      {alert: true,
      alert_type: "alert-warning",
      alert_msg: "<strong>Warning !</strong> Password not secure," +
        " it has to be at least 6 characters long and contain" +
        " a number an uppercase and a lowercase letter."});
    return;
  }

  password(pass).hash(function(error, hash) {
    mongodb.MongoClient.connect("mongodb://localhost:27017/matcha", function(err, db) {
      assert.equal(null, err);
      assert.ok(db != null);
      db.collection("users").count({username: username}, function(err, count) {
        if (err)
          throw err;
        if (count == 0)
        {
          db.collection("users").insert
            ({"username": username,
              "password": hash,
              "email": email,
              "firstname": firstname,
              "lastname": lastname},
              function (err, resp) {
                if (err)
                  throw err;
                res.render(__dirname + '/../views/templates/index.ejs',
                  {alert: true,
                  alert_type: "alert-success",
                  alert_msg: "<strong>Success !</strong> Account was created."});
                  return;
              });
        } else {
          res.render(__dirname + '/../views/templates/index.ejs',
            {alert: true,
            alert_type: "alert-warning",
            alert_msg: "<strong>Warning !</strong> Username already taken."});
            return;
        }
      });
    });
  })
});

// io.use(sharedsession(session, {
//     autoSave:true
// }));

io.on('connection', function(socket) {
  socket.on('chat message', function(msg) {
    console.log("Chat msg");
    io.emit('chat message', msg);
  });
});

http.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
