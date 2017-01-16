var session = require('express-session');
var express = require('express');
var app = express();
var path = require('path');
var assert = require('assert');

var mongodb = require('mongodb');

var password = require('password-hash-and-salt');

app.set('view engine', 'ejs');
app.use(session({secret: 'ksljflksdfj',
                resave: false,
                saveUninitialized: false}));

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'user')));

app.get('/', function (req, res) {
  if (req.session.login) {
    res.render(__dirname + '/user/main.ejs');
  } else {
    res.render(__dirname + '/user/home.ejs', { alert: false});
  }
});

app.get('/setup', function (req, res) {
  var db = new mongodb.Db('matcha', new mongodb.Server('localhost', 27017));
  db.open(function(err, db) {
    //var users = db.collection('users');
    db.close();
    });
    res.redirect('/');
});


app.post('/login', function (req, res) {

  mongodb.MongoClient.connect("mongodb://localhost:27017/matcha", function(err, db) {
    assert.equal(null, err);
    assert.ok(db != null);
    db.collection("users").findOne({username: req.body.username}, {password: 1, _id: 0}, function(err, doc) {
      password(req.body.password).verifyAgainst(doc.password, function(error, verified) {
         if(error)
             throw new Error('Something went wrong!');
         if(!verified) {
           res.render(__dirname + '/user/home.ejs',
             {alert: true,
             alert_type: "alert-warning",
             alert_msg: "<strong>Warning !</strong> Wrong password."});
             return;
         } else {
          req.session.login = req.body.username;
          res.redirect('/');
          return;
         }
      });
    });
  });
});

app.post('/register', function (req, res) {
  var username = req.body.username,
  email = req.body.email,
  firstname = req.body.firstname,
  lastname = req.body.lastname,
  pass = req.body.password;

  if (pass !== req.body['confirm-password']) {
    res.render(__dirname + '/user/home.ejs',
      {alert: true,
      alert_type: "alert-warning",
      alert_msg: "<strong>Warning !</strong> Password confirmation and password are different."});
      return;
  }

  if (pass < 6
      || !/[a-z]/.test(pass)
      || !/[A-Z]/.test(pass)
      || !/[0-9]/.test(pass)) {
    res.render(__dirname + '/user/home.ejs',
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
                res.render(__dirname + '/user/home.ejs',
                  {alert: true,
                  alert_type: "alert-success",
                  alert_msg: "<strong>Success !</strong> Account was created."});
                  return;
              });
        } else {
          res.render(__dirname + '/user/home.ejs',
            {alert: true,
            alert_type: "alert-warning",
            alert_msg: "<strong>Warning !</strong> Username already taken."});
            return;
        }
      });
    });
  })
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
