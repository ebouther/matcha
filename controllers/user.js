var exports = module.exports = {};

var mongodb = require('mongodb');
var assert = require('assert');
var request = require('request');

var io = require('./app').io;

var nodemailer = require('nodemailer');


exports.securePass = function(pass) {
	return (pass.length > 6
		&& /[a-z]/.test(pass)
		&& /[A-Z]/.test(pass)
		&& /[0-9]/.test(pass));
}

exports.sendMail = function (req, username, token, cb) {

		let transporter = nodemailer.createTransport({
	    sendmail: true,
	    newline: 'unix',
	    path: '/usr/sbin/sendmail'
	});
	var mailOptions = {
		to: req.body.email,
		subject: 'Matcha - Forgot Password',
		html: "Hi " + username + ", here's a " + "<a href=\"http://" + req.headers.host + "/reset?token=" + token + "\">link</a>" + " to reset your matcha password."
	}
	transporter.sendMail(mailOptions, function(err, res) {
    cb(err, res)
	});
}


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
      if (body.status === "success" && body.lat && body.lon) {
        req.db.collection("users").update(
          { username: req.session.username },
          { $set: {ip_lat_lng: [body.lat, body.lon]} },
          { upsert : true }
        );
      }
    }
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

function distanceBetween(a, b)
{
	var a_lat_lng = a.lat_lng ? a.lat_lng : a.ip_lat_lng;
	var b_lat_lng = b.lat_lng ? b.lat_lng : b.ip_lat_lng;

	if (!a_lat_lng || !b_lat_lng)
		return 0;//20033; //earth circonference : 40075
	else
		return getDistanceFromLatLonInKm(a_lat_lng[0], a_lat_lng[1], b_lat_lng[0], b_lat_lng[1]);

}

function commonTags(me, b) {
	var me_interests = me.interests ? me.interests.split(",") : [];
	var b_interests = b.interests ? b.interests.split(",") : [];
	var common_int = 0;

	me_interests.forEach(function (interest) {
		if (b_interests.indexOf(interest) !== -1)
			common_int++;
	});
	return common_int;
}

function sortWeight(a, max) {
	console.log("DIST_INV : " + (100 - ((max.dist ? (a.dist_from_me / max.dist) : 0) * 100)));
	// console.log("COMMON TAGS : " + (max.commonTags ? a.commonTags / max.commonTags : 0) * 100)
	// console.log("POPULARITY : " + (max.popularity ? a.popularity / max.popularity : 0) * 100)
	//
	// console.log("WEIGHT : ", 						((max.dist_inv ? ((a.dist_from_me ? 1 / a.dist_from_me : 1)) / max.dist_inv : 0) * 100
	// 																		+ (max.commonTags ? a.commonTags / max.commonTags : 0) * 100
	// 																		+ (max.popularity ? a.popularity / max.popularity : 0) * 100)
	// 																		/ 3);
	if (!a.popularity)
		a.popularity = 0;

	return (
						(100 - ((max.dist ? (a.dist_from_me / max.dist) : 0) * 100)
						+ (max.commonTags ? a.commonTags / max.commonTags : 1) * 100
						+ (max.popularity ? a.popularity / max.popularity : 1) * 100)
						/ 3
				 );
}

function weightedSort(data, req, res) {
	var max = {
		min_dist   : 0,
		commonTags : 0,
		popularity : 0
	};

	data.users.forEach(function (user) {
		user.dist_from_me = distanceBetween(data.me, user);
		user.commonTags = commonTags(data.me, user);

		if (user.commonTags > max.commonTags)
			max.commonTags = user.commonTags;
		if (user.popularity > max.popularity)
			max.popularity = user.popularity;
		if (user.dist_from_me > max.dist_from_me)
			max.dist = user.dist_from_me;
	});

	data.users.sort(function (a, b) {

		a.sort_weight = sortWeight(a, max);
		b.sort_weight = sortWeight(b, max);

		if (!a.sort_weight && !b.sort_weight)
			return 0;
		else if (!b.sort_weight)
			return -1;
		else if (!a.sort_weight)
			return 1;
		return (b.sort_weight - a.sort_weight);
	});
	res.json(data);
}

function sortSuggestions (data, req, res) {

  switch (req.body.search.sort) {

    case "age":
      console.log("SORT BY AGE");
      data.users.sort(function (a, b) {
        if (!a.age && !b.age)
          return 0;
        else if (!a.age)
          return 1;
        else if (!b.age)
          return -1;
        return (b.age - a.age);
      });
      break;

    case "pop":
      console.log("SORT BY POP");
      data.users.sort(function (a, b) {
        if (!a.popularity && !b.popularity)
          return 0;
        else if (!a.popularity)
          return 1;
        else if (!b.popularity)
          return -1;
        return (b.popularity - a.popularity);
      });
      break;

    case "tag":
      console.log("SORT BY TAG");
      // console.log("ME : ", data.me);
      var my_tags = data.me.interests ? data.me.interests.split(",") : [];
      // console.log("BEFORE : ", data.users);
      data.users.sort(function (a, b) {
        var a_interests = a.interests ? a.interests.split(",") : [];
        var b_interests = b.interests ? b.interests.split(",") : [];
        a.commonTags = 0;
        b.commonTags = 0;

        my_tags.forEach(function (interest) {
          if (a_interests.indexOf(interest) !== -1)
            a.commonTags++;
          if (b_interests.indexOf(interest) !== -1)
            b.commonTags++;
        });

        return (b.commonTags - a.commonTags);
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

        a.dist_from_me = getDistanceFromLatLonInKm(a_lat_lng[0], a_lat_lng[1], lat_lng[0], lat_lng[1]);
        b.dist_from_me = getDistanceFromLatLonInKm(b_lat_lng[0], b_lat_lng[1], lat_lng[0], lat_lng[1]);


        return (a.dist_from_me - b.dist_from_me);
      });
      break;
  }
  // res.render(__dirname + '/../views/templates/suggestions.ejs', data);
  res.json(data);
}

function filterSuggestions (data, req, res) {
  var interests = req.body.interests ? req.body.interests.split(",") : [];
	var search = req.body.search;



	// console.log("POST : ", req.body);
	// console.log("USERS : ", data.users);
	// console.log("SEARCH : ", search);

	console.log("USERS LEN", data.users.length);

	if (search) {
	  data.users = data.users.filter(function (user) {

	      if (search.age_min && search.age_min !== ""
	          && (!user.age || user.age < search.age_min))
	      {
	        console.log("TOO YOUNG - REMOVE USER : ");
	        return 0;
	      }
	      if (search.age_max && !isNaN(search.age_max)
	          && (!user.age || user.age > parseInt(search.age_max)))
	      {
	        console.log("TOO OLD - REMOVE USER : ", user.username);
					return 0;
	      }

	      if (search.pop_min && search.pop_min !== ""
	          && (!user.popularity || user.popularity < search.pop_min))
	      {
	        console.log("NOT ENOUGH POP - REMOVE USER : ", user.username);
					return 0;
	      }

	      if (search.pop_max && search.pop_max !== ""
	          && (!user.popularity || user.popularity > search.pop_max))
	      {
	        console.log("TOO POP - REMOVE USER : ", user.username);
					return 0;
	      }

	      if (user.interests) {
	        var user_interests = user.interests ? user.interests.split(",") : [];
	        interests.forEach(function (interest) {
	          if (user_interests.indexOf(interest) === -1)
	          {
	            console.log("MISSING INTEREST :", interest, "- REMOVE USER : ", user.username);
							return 0;
	          }
	        });
	      } else if (interests.length > 0) {
	        console.log("MISSING INTEREST - REMOVE USER : ", user.username);
					return 0;
	      }

	      if (search.lat && search.lng
	          && search.lat !== "" && search.lng !== ""
	          && (!user.lat_lng || search.lat !== user.lat_lng[0] || search.lng !== user.lat_lng[1]))
	      {
	        console.log("MISSING LOCATION - REMOVE USER : ", user.username);
					return 0;
	      }
				return 1;

	  });
	}
	if (req.body.search && req.body.search.sort) {
		sortSuggestions(data, req, res);
	} else {
		weightedSort(data, req, res);
	}
}

exports.loadSuggestions = function (db, req, res) {
  req.db.collection("users").findOne({username: req.session.username}, {password: 0, _id: 0}, function(err, me) {
      switch (me.sex_pref) {
        case "Hetero":
          if (me.gender === "Male") {
            console.log("DBG 1");
              req.db.collection("users").find({gender: "Female", username: {$ne: req.session.username}}, {password: 0, _id: 0}).toArray(function(err, doc) {
                filterSuggestions({users: doc, me: me}, req, res);
              });
          } else {
            console.log("DBG 2");
            req.db.collection("users").find({gender: "Male", username: {$ne: req.session.username}}, {password: 0, _id: 0}).toArray(function(err, doc) {
              filterSuggestions({users: doc, me: me}, req, res);
            });
          }
        break;
        case "Gay":
          if (me.gender === "Male") {
            console.log("DBG 3");
            req.db.collection("users").find({gender: "Male", username: {$ne: req.session.username}}, {password: 0, _id: 0}).toArray(function(err, doc) {
              filterSuggestions({users: doc, me: me}, req, res);
              //res.render(__dirname + '/../views/templates/suggestions.ejs', {users: doc, me: me});
            });
          } else {
            console.log("DBG 4");
            req.db.collection("users").find({gender: "Female", username: {$ne: req.session.username}}, {password: 0, _id: 0}).toArray(function(err, doc) {
              filterSuggestions({users: doc, me: me}, req, res);
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
