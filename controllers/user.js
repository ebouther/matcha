var exports = module.exports = {};

var mongodb = require('mongodb');
var assert = require('assert');
var request = require('request');

var io = require('./app').io;

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371;
  var dLat = deg2rad(lat2-lat1);
  var dLon = deg2rad(lon2-lon1);
  var a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c;
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

exports.saveIpLocation = function (db, req, res) {
  var ip = req.ip;

  console.log("IP : (", ip, ")");

  var options = {
      uri: 'http://ip-api.com' + '/json/' + ((ip === "::ffff:127.0.0.1" || ip === "::1" || ip === "127.0.0.1") ? '62.210.34.252' : ip),
      method: 'GET',
      json:true
  }
  console.log("REQUEST URI : ", options.uri);
  request(options, function(err, result, body) {
    if (!err) {
      console.log("LAT LNG BODY : ", body);
      if (body.lat && body.lon) {
        req.db.collection("users").update(
          { username: req.session.username },
          { $set: {ip_lat_lng: [body.lat, body.lon]} },
          { upsert : true }
        );
      }
    }
    res.redirect('/');
  });
}

exports.getMessages = function (req, user1, user2, cb) {
  mongodb.MongoClient.connect("mongodb://localhost:27017/matcha", function(err, db) {
    assert.equal(null, err);
    assert.ok(db != null);


    req.db.collection("users").findOne({ username: user1 }, function (err, user) {
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

exports.saveMessage = function (req, message) {
  mongodb.MongoClient.connect("mongodb://localhost:27017/matcha", function(err, db) {
    assert.equal(null, err);
    assert.ok(db != null);

    var key = message.to;
    var obj = {};
    obj[key] = message.msg;


    console.log("SAVE MESSAGE IN " + message.to);
    console.log("SAVE MESSAGE IN " + message.from);


    req.db.collection("users").update({ username: message.from},
                                  { $addToSet: { chat: {name: message.to} }}
     );

    req.db.collection("users").update(
      { username: message.from, "chat.name": message.to },
      { $push: {"chat.$.message": message} },
      { upsert : true }
    );



    req.db.collection("users").update({ username: message.to},
                                  { $addToSet: { chat: {name: message.from} }}
     );

    req.db.collection("users").update(
      { username: message.to, "chat.name": message.from },
      { $push: {"chat.$.message": message} },
      { upsert : true }
    );

  });
}

exports.isOnline = function (username) {
  return Object.keys(io.sockets.sockets).some(function(socket_id) {
    return (io.sockets.sockets[socket_id].request.session.username === username);
  });
}

exports.likeEachOther = function (req, username1, username2, cb) {
  mongodb.MongoClient.connect("mongodb://localhost:27017/matcha", function(err, db) {
    assert.equal(null, err);
    assert.ok(db != null);
      req.db.collection("users").findOne({username: username1}, {password: 0, _id: 0}, function(err, user1) {
        if (user1 && user1.like && user1.like.indexOf(username2) !== -1) {
            req.db.collection("users").findOne({username: username2}, {password: 0, _id: 0}, function(err, user2) {
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
    req.db.collection("users").findOne({username: req.session.username}, {password: 0, _id: 0}, function(err, doc) {
      res.render(__dirname + '/../views/templates/main.ejs', doc);
    });
  });
}

function sortSuggestions (data, req, res) {
  console.log("SORT : ", req.query.sort);
  switch (req.query.sort) {

    case "age":
      console.log("SORT BY AGE");
      data.users.sort(function (a, b) {
        if (!a.age && !b.age)
          return 0;
        else if (!a.age)
          return -1;
        else if (!b.age)
          return 1;
        return (a.age - b.age);
      });
      break;

    case "pop":
      console.log("SORT BY POP");
      data.users.sort(function (a, b) {
        if (!a.popularity && !b.popularity)
          return 0;
        else if (!a.popularity)
          return -1;
        else if (!b.popularity)
          return 1;
        return (a.popularity - b.popularity);
      });
      break;

    case "tag":
      console.log("SORT BY TAG");
      console.log("ME : ", data.me);
      var my_tags = data.me.interests ? data.me.interests.split(",") : [];
      console.log("BEFORE : ", data.users);
      data.users.sort(function (a, b) {
        var a_interests = a.interests ? a.interests.split(",") : [];
        var b_interests = b.interests ? b.interests.split(",") : [];
        var a_common_int = 0;
        var b_common_int = 0;

        my_tags.forEach(function (interest) {
          if (a_interests.indexOf(interest) !== -1)
            a_common_int++;
          if (b_interests.indexOf(interest) !== -1)
            b_common_int++;
        });

        console.log("COMMON ", a_common_int,  b_common_int);
        return (b_common_int - a_common_int);
      });
      console.log("AFTER : ", data.users);
      break;

    case "loc":
      console.log("SORT BY LOC");

      var lat_lng = data.me.lat_lng ? data.me.lat_lng : data.me.ip_lat_lng;
      console.log("LAT LNG : ", lat_lng);

      data.users.sort(function (a, b) {

        console.log("A : ", a);
        console.log("B : ", b);

        var a_lat_lng = a.lat_lng ? a.lat_lng : a.ip_lat_lng;
        var b_lat_lng = b.lat_lng ? b.lat_lng : b.ip_lat_lng;

        console.log("A LAT LNG : ", a_lat_lng);
        console.log("B LAT LNG : ", b_lat_lng);

        var a_dist = getDistanceFromLatLonInKm(a_lat_lng[0], a_lat_lng[1], lat_lng[0], lat_lng[1]);
        var b_dist = getDistanceFromLatLonInKm(b_lat_lng[0], b_lat_lng[1], lat_lng[0], lat_lng[1]);

        console.log("A_DIST : ", a_dist);
        console.log("B_DIST : ", b_dist);

        return (a_dist - b_dist);
      });
      break;
  }
  res.render(__dirname + '/../views/templates/suggestions.ejs', data);
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
        var user_interests = user.interests ? user.interests.split(",") : [];
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

      if (req.query.lat && req.query.lng
          && req.query.lat !== "" && req.query.lng !== ""
          && (!user.lat_lng || req.query.lat !== user.lat_lng[0] || req.query.lng !== user.lat_lng[1]))
      {
        console.log("MISSING LOCATION - REMOVE USER : ", user.username);
        data.users.splice(i, 1);
      }

  });
  sortSuggestions(data, req, res);
}

exports.loadSuggestions = function (db, req, res) {
  req.db.collection("users").findOne({username: req.session.username}, {password: 0, _id: 0}, function(err, me) {
      switch (me.sex_pref) {
        case "Hetero":
          if (me.gender === "Male") {
            console.log("DBG 1");
              req.db.collection("users").find({gender: "Female", username: {$ne: req.session.username}}, {password: 0, _id: 0}).toArray(function(err, doc) {
                filterSuggestions({users: doc, me: me});
                //res.render(__dirname + '/../views/templates/suggestions.ejs', {users: doc, me: me});
              });
          } else {
            console.log("DBG 2");
            req.db.collection("users").find({gender: "Male", username: {$ne: req.session.username}}, {password: 0, _id: 0}).toArray(function(err, doc) {
              filterSuggestions({users: doc, me: me});
              //res.render(__dirname + '/../views/templates/suggestions.ejs', {users: doc, me: me});
            });
          }
        break;
        case "Gay":
          if (me.gender === "Male") {
            console.log("DBG 3");
            req.db.collection("users").find({gender: "Male", username: {$ne: req.session.username}}, {password: 0, _id: 0}).toArray(function(err, doc) {
              filterSuggestions({users: doc, me: me});
              //res.render(__dirname + '/../views/templates/suggestions.ejs', {users: doc, me: me});
            });
          } else {
            console.log("DBG 4");
            req.db.collection("users").find({gender: "Female", username: {$ne: req.session.username}}, {password: 0, _id: 0}).toArray(function(err, doc) {
              filterSuggestions({users: doc, me: me});
              //res.render(__dirname + '/../views/templates/suggestions.ejs', {users: doc, me: me});
            });
          }
        break;
        default:
          console.log("DBG 5");
          req.db.collection("users").find({username: {$ne: req.session.username}}, {password: 0, _id: 0}).toArray(function(err, doc) {
            filterSuggestions({users: doc, me: me}, req, res);
            //res.render(__dirname + '/../views/templates/suggestions.ejs', {users: doc, me: me});
          });
      }

  });

}
