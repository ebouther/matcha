var express = require('express');
var router = express.Router();

var user = require("./user");

router.get('/', function (req, res) {
  if (req.session.username) {
    user.loadProfile(req, res);
  } else {
    res.render(__dirname + '/public/home.ejs', { alert: false});
  }
});

//  ------ useless
router.get('/setup', function (req, res) {
  var db = new mongodb.Db('matcha', new mongodb.Server('localhost', 27017));
  db.open(function(err, db) {
    //var users var greetings = require("./greetings.js");= db.collection('users');
    db.close();
    });
    res.redirect('/');
});

router.get('/search', function (req, res) {
  var login = req.query.login;
  mongodb.MongoClient.connect("mongodb://localhost:27017/matcha", function(err, db) {
    assert.equal(null, err);
    assert.ok(db != null);

  });
});

router.get('/suggestions', function (req, res) {
  if (!req.session.username)
  {
    res.redirect('/');
    return;
  }
  mongodb.MongoClient.connect("mongodb://localhost:27017/matcha", function(err, db) {
    assert.equal(null, err);
    assert.ok(db != null);
    if (req.query.username) {
      db.collection("users").findOne({username: req.query.username}, {password: 0, _id: 0}, function(err, doc) {
        if (doc)
          res.render(__dirname + '/public/suggestions.ejs', {users: [doc]});
        else {
          res.render(__dirname + '/public/suggestions.ejs');
        }
      });
    } else {
      var greetings = require("./greetings.js");
      user.loadSuggestions(db, req, res);
    }
  });
});

module.exports = router;
