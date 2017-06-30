var express = require('express');
var router = express.Router();

var path = require('path');
var mongodb = require('mongodb'); //should be only present in models :/
var assert = require('assert');

var user = require("./user");

router.get('/', function (req, res) {
  if (req.session.username) {
    user.loadProfile(req, res);
  } else {
    res.render(path.join(__dirname, '/../views/templates/index.ejs'), { alert: false});
  }
});

router.get('/user', function (req, res) {
  if (req.session.username) {
  	var db = new mongodb.Db('matcha', new mongodb.Server('localhost', 27017));
	  mongodb.MongoClient.connect("mongodb://localhost:27017/matcha", function(err, db) {
      assert.equal(null, err);
      assert.ok(db != null);
      if (req.query.username) {
      	db.collection("users").findOneAndUpdate({username: req.query.username}, {$push: {"history": "Viewed by " + req.session.username}}, {upsert: true, projection:{password: 0, _id: 0}}, function(err, usr) {
      	  if (usr && usr.value && usr.value.username) {
            console.log("ISONLINE : ", user.isOnline(usr.value.username));
            usr.value.online = user.isOnline(usr.value.username);
            res.render(path.join(__dirname, '/../views/templates/user.ejs'), {user: usr.value});
          } else {
            res.render(__dirname + '/../views/templates/suggestions.ejs');
          }
      	});
      }
    });
  } else {
    res.render(path.join(__dirname, '/../views/templates/index.ejs'), { alert: false});
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
        if (doc) {
          res.render(__dirname + '/../views/templates/suggestions.ejs', {users: [doc]});
        }
        else {
          res.render(__dirname + '/../views/templates/suggestions.ejs');
        }
      });
    } else {
      user.loadSuggestions(db, req, res);
    }
  });
});

router.get('/contacts', function (req, res) {
  console.log("GET /contacts");
  if (!req.session.username)
  {
    res.redirect('/');
    return;
  }
  mongodb.MongoClient.connect("mongodb://localhost:27017/matcha", function(err, db) {
    assert.equal(null, err);
    assert.ok(db != null);
    if (req.session.username) {
      var contacts = [];
      console.log("********   USERNAME : ", req.session.username);
      db.collection("users").findOne({username: req.session.username}, {password: 0, _id: 0}, function(err, me) {
        console.log("********   ME : ", me);
        var promises = [];
          if (me.like) {
            me.like.forEach(function(username) {
              //promises.push()
              promises.push(new Promise((resolve, reject) => {
                db.collection("users").findOne({username: username}, {password: 0, _id: 0}, function(err, user) {
                  if (user && user.like && user.like.indexOf(req.session.username) !== -1) {
                    console.log("CONTACT : " + username);
                    //contacts.push(username);
                    resolve(username);
                  } else {
                    resolve(undefined);
                  }
                });
              }));
            });
          }
          Promise.all(promises).then(contacts => {
            console.log("CONTACTS : " + JSON.stringify(contacts));
            res.json(contacts.filter(Boolean));
          });
      });
    }
  });
});

router.get('/disconnect', function (req, res) {
  req.session.destroy(function (err) {
    res.redirect('/');
  });
});

router.get('/chat', function (req, res) {
    res.render(__dirname + '/../views/templates/chat.ejs');
});

module.exports = router;
