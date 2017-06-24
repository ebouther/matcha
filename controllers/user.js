var exports = module.exports = {};

var mongodb = require('mongodb');
var assert = require('assert');
var request = require('request');


exports.likeEachOther = function (username1, username2, cb) {
  mongodb.MongoClient.connect("mongodb://localhost:27017/matcha", function(err, db) {
    assert.equal(null, err);
    assert.ok(db != null);
      db.collection("users").findOne({username: username1}, {password: 0, _id: 0}, function(err, user1) {
        if (user1 && user1.like && user1.like.indexOf(username2) !== -1) {
            db.collection("users").findOne({username: username2}, {password: 0, _id: 0}, function(err, user2) {
                if (user2 && user2.like && user2.like.indexOf(username1) !== -1) {
                  console.log(username1 + " AND " + username2 + " MATCH");
                  cb(true);
                } else {
                  cb(false);
                }
            });
        } else { cb(false); }
      });
  });
}

exports.loadProfile = function (req, res) {
  mongodb.MongoClient.connect("mongodb://localhost:27017/matcha", function(err, db) {
    assert.equal(null, err);
    assert.ok(db != null);
    db.collection("users").findOne({username: req.session.username}, {password: 0, _id: 0}, function(err, doc) {
      res.render(__dirname + '/../views/templates/main.ejs', doc);
    });
  });
}

exports.loadSuggestions = function (db, req, res) {
  db.collection("users").findOne({username: req.session.username}, {password: 0, _id: 0}, function(err, me) {
    if (me) {
      switch (me.sex_pref) {
        case "Hetero":
          if (doc.gender === "Male") {
            console.log("DBG 1");
              db.collection("users").find({gender: "Female", username: {$ne: req.session.username}}, {password: 0, _id: 0}).toArray(function(err, doc) {
                res.render(__dirname + '/../views/templates/suggestions.ejs', {users: doc, me: me});
              });
          } else {
            console.log("DBG 2");
            db.collection("users").find({gender: "Male", username: {$ne: req.session.username}}, {password: 0, _id: 0}).toArray(function(err, doc) {
              res.render(__dirname + '/../views/templates/suggestions.ejs', {users: doc, me: me});
            });
          }
        break;
        case "Gay":
          if (doc.gender === "Male") {
            console.log("DBG 3");
            db.collection("users").find({gender: "Male", username: {$ne: req.session.username}}, {password: 0, _id: 0}).toArray(function(err, doc) {
              console.log(doc);
              res.render(__dirname + '/../views/templates/suggestions.ejs', {users: doc, me: me});
            });
          } else {
            console.log("DBG 4");
            db.collection("users").find({gender: "Female", username: {$ne: req.session.username}}, {password: 0, _id: 0}).toArray(function(err, doc) {
              res.render(__dirname + '/../views/templates/suggestions.ejs', {users: doc, me: me});
            });
          }
        break;
        default:
          console.log("DBG 5");
          db.collection("users").find({username: {$ne: req.session.username}}, {password: 0, _id: 0}).toArray(function(err, doc) {
            res.render(__dirname + '/../views/templates/suggestions.ejs', {users: doc, me: me});
          });
      }
    }
  });

}
