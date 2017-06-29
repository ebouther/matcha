var exports = module.exports = {};

var mongodb = require('mongodb');
var assert = require('assert');
var request = require('request');

exports.saveIpLocation = function (db, req, res) {
  var ip = req.ip;

  console.log("IP : ", ip);

  var options = {
      uri: 'http://ip-api.com' + '/json/' + ((ip === "::1" || ip === "127.0.0.1") ? '62.210.34.252' : ip),
      method: 'GET',
      json:true
  }
  request(options, function(err, result, body) {
    if (!err) {
      request('https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDc3Tx5tuzRnZ8KGgKRIdvHyi-6oTyZPCE&latlng=' + body.lat + ',' + body.lon, function (err, result, place) {
        place = JSON.parse(place);

        if (!err && place.results
          && place.results.length > 0
          && place.results[0].place_id)
        {
          var ip_loc = place.results[0].place_id;

          db.collection("users").update(
            { username: req.session.username },
            { $set: {ip_loc: ip_loc} },
            { upsert : true }
          );
        }
        res.redirect('/');
      });
    } else { res.redirect('/'); }
  });
}

exports.getMessages = function (user1, user2, cb) {
  mongodb.MongoClient.connect("mongodb://localhost:27017/matcha", function(err, db) {
    assert.equal(null, err);
    assert.ok(db != null);


    db.collection("users").findOne({ username: user1 }, function (err, user) {
      assert.equal(null, err);
      console.log("USER 2 : ", user2);
      console.log("CHAT : ", user.chat);
      var msg = undefined;
      if (user && user.chat && (msg = user.chat.find(function(chat) { return (chat.name === user2) }))) {
        cb(msg.message);
      } else {cb(undefined);}
    });

  });
}

exports.saveMessage = function (message) {
  mongodb.MongoClient.connect("mongodb://localhost:27017/matcha", function(err, db) {
    assert.equal(null, err);
    assert.ok(db != null);

    var key = message.to;
    var obj = {};
    obj[key] = message.msg;


    console.log("SAVE MESSAGE IN " + message.to);
    console.log("SAVE MESSAGE IN " + message.from);


    db.collection("users").update({ username: message.from},
                                  { $addToSet: { chat: {name: message.to} }}
     );

    db.collection("users").update(
      { username: message.from, "chat.name": message.to },
      { $push: {"chat.$.message": message} },
      { upsert : true }
    );



    db.collection("users").update({ username: message.to},
                                  { $addToSet: { chat: {name: message.from} }}
     );

    db.collection("users").update(
      { username: message.to, "chat.name": message.from },
      { $push: {"chat.$.message": message} },
      { upsert : true }
    );

  });
}

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

function filterSuggestions (data, req, res) {
  var interests = req.query.interests ? req.query.interests.split(",") : [];

  console.log("QUERIES : ", req.query);
  data.users.forEach(function (user, i) {
      if (req.query.age_min && req.query.age_min !== ""
          && (!user.age || user.age < req.query.age_min))
      {
        console.log("TOO YOUNG - REMOVE USER : ", i);
        data.users.splice(i, 1);
      }
      if (req.query.age_max && !isNaN(req.query.age_max)
          && (!user.age || user.age > parseInt(req.query.age_max)))
      {
        console.log("TOO OLD - REMOVE USER : ", user.username);
        data.users.splice(i, 1);
      }

      if (req.query.pop_min && req.query.pop_min !== ""
          && (!user.pop || user.pop < req.query.pop_min))
      {
        console.log("NOT ENOUGH POP - REMOVE USER : ", user.username);
        data.users.splice(i, 1);
      }

      if (req.query.pop_max && req.query.pop_max !== ""
          && (!user.pop || user.pop > req.query.pop_max))
      {
        console.log("TOO POP - REMOVE USER : ", user.username);
        data.users.splice(i, 1);
      }

      if (user.interests) {
        var user_interests = user.interests.split(",");
        interests.forEach(function (interest) {
          if (user_interests.indexOf(interest) === -1)
          {
            console.log("MISSING INTEREST :", interest, "- REMOVE USER : ", user.username);
            data.users.splice(i, 1);
          }
        });
      } else if (interests.length > 0) {
        console.log("MISSING INTEREST - REMOVE USER : ", user.username);
        data.users.splice(i, 1);
      }

      if (req.query.location
        && req.query.location !== user.location)
      {
        console.log("MISSING LOCATION - REMOVE USER : ", user.username);
        data.users.splice(i, 1);
      }

  });
  res.render(__dirname + '/../views/templates/suggestions.ejs', data);
}

exports.loadSuggestions = function (db, req, res) {
  db.collection("users").findOne({username: req.session.username}, {password: 0, _id: 0}, function(err, me) {
      switch (me.sex_pref) {
        case "Hetero":
          if (me.gender === "Male") {
            console.log("DBG 1");
              db.collection("users").find({gender: "Female", username: {$ne: req.session.username}}, {password: 0, _id: 0}).toArray(function(err, doc) {
                filterSuggestions({users: doc, me: me});
                //res.render(__dirname + '/../views/templates/suggestions.ejs', {users: doc, me: me});
              });
          } else {
            console.log("DBG 2");
            db.collection("users").find({gender: "Male", username: {$ne: req.session.username}}, {password: 0, _id: 0}).toArray(function(err, doc) {
              filterSuggestions({users: doc, me: me});
              //res.render(__dirname + '/../views/templates/suggestions.ejs', {users: doc, me: me});
            });
          }
        break;
        case "Gay":
          if (me.gender === "Male") {
            console.log("DBG 3");
            db.collection("users").find({gender: "Male", username: {$ne: req.session.username}}, {password: 0, _id: 0}).toArray(function(err, doc) {
              filterSuggestions({users: doc, me: me});
              //res.render(__dirname + '/../views/templates/suggestions.ejs', {users: doc, me: me});
            });
          } else {
            console.log("DBG 4");
            db.collection("users").find({gender: "Female", username: {$ne: req.session.username}}, {password: 0, _id: 0}).toArray(function(err, doc) {
              filterSuggestions({users: doc, me: me});
              //res.render(__dirname + '/../views/templates/suggestions.ejs', {users: doc, me: me});
            });
          }
        break;
        default:
          console.log("DBG 5");
          db.collection("users").find({username: {$ne: req.session.username}}, {password: 0, _id: 0}).toArray(function(err, doc) {
            filterSuggestions({users: doc, me: me}, req, res);
            //res.render(__dirname + '/../views/templates/suggestions.ejs', {users: doc, me: me});
          });
      }

  });

}
