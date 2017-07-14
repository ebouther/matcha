var express = require('express');
var router = express.Router();

var io = require('./app').io;

var mongodb = require('mongodb');
var db = require('./app').db;

var path = require('path');
var assert = require('assert');

var crypto  = require('crypto');

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

      if (req.query.username) {
      	req.db.collection("users").findOneAndUpdate({username: req.query.username}, {$push: {"history": "<a href='/user?username=" + req.session.username + "'>Viewed by " + req.session.username + "</a>"}, $inc: {'popularity': 1} }, {/*upsert: true,*/ projection:{password: 0, _id: 0}}, function(err, usr) {
      	  if (usr && usr.value && usr.value.username) {
            console.log("ISONLINE : ", user.isOnline(usr.value.username));
            usr.value.online = user.isOnline(usr.value.username);
            res.render(path.join(__dirname, '/../views/templates/user.ejs'), {user: usr.value});
          } else {
            res.render(__dirname + '/../views/templates/suggestions.ejs');
          }
      	});
        var message = req.session.username + " viewed your profile";
        Object.keys(io.sockets.sockets).forEach(function(socket_id) {
          var user = io.sockets.sockets[socket_id];
          if (user.request.session.username === req.query.username) {
            io.to(socket_id).emit('notif', message);
          }
        });
        req.db.collection("users").update(
          { username: req.query.username },
          { $push: {"notification": message} }
          // { upsert : true }
        );
      }
  } else {
    res.render(path.join(__dirname, '/../views/templates/index.ejs'), { alert: false});
  }
});

router.post('/forgot', function (req, res) {
  if (!req.body.email)
    res.redirect('/');

    var _res = res;

    if (req.body.email) {
    	req.db.collection("users").findOne({email: req.body.email}, {password: 0, _id: 0},  function(err, usr) {
    	  if (usr &&  usr.username) {
          var token = crypto.randomBytes(64).toString('hex');

          req.db.collection("users").update({"email" : req.body.email},
            {$set: {pwdToken: token}}, function (err, res) {

              user.sendMail(req, usr.username, token, function (error, result) {
                if (error) {
                  return _res.render(path.join(__dirname, '/../views/templates/index.ejs'),
                            {alert: true,
                            alert_type: "alert-danger",
                            alert_msg: "<strong> Error !</strong> Mail error: " + error});
                }
                return _res.render(path.join(__dirname, '/../views/templates/index.ejs'),
                        {alert: true,
                        alert_type: "alert-success",
                        alert_msg: "<strong> Success !</strong> Mail sent."});
              });
            });

        } else {
          return _res.render(path.join(__dirname, '/../views/templates/index.ejs'),
                    {alert: true,
                    alert_type: "alert-danger",
                    alert_msg: "<strong> Error !</strong> User not found."});
        }
    	});
    } else {
      return _res.render(path.join(__dirname, '/../views/templates/index.ejs'),
          {alert: true,
          alert_type: "alert-danger",
          alert_msg: "<strong> Error !</strong> Enter username."});
    }
	});
});

router.get('/suggestions', function (req, res) {
  if (!req.session.username)
  {
    res.redirect('/');
    return;
  }

  res.render(__dirname + '/../views/templates/suggestions.ejs');

});

router.post('/suggestions', function (req, res) {
  if (req.session.username) {
    if (req.body.username) {
      req.db.collection("users").findOne({username: req.query.username}, {password: 0, _id: 0}, function(err, doc) {
        if (doc) {
          res.json({users: [doc]});
        }
      });
    } else {
      user.loadSuggestions(db, req, res);
    }
  } else {
    res.end();
  }
});

router.post('/del_notifs', function (req, res) {

  if (req.session.username) {

    req.db.collection("users").update(
      { username: req.session.username },
      { $set: {"notification": []} },
      { upsert : true }
    );

  }

  res.end();
});


router.get('/contacts', function (req, res) {
  console.log("GET /contacts");
  if (!req.session.username)
  {
    res.redirect('/');
    return;
  }

    if (req.session.username) {
      var contacts = [];
      console.log("********   USERNAME : ", req.session.username);
      req.db.collection("users").findOne({username: req.session.username}, {password: 0, _id: 0}, function(err, me) {
        console.log("********   ME : ", me);
        var promises = [];
          if (me && me.like) {
            me.like.forEach(function(username) {
              //promises.push()
              promises.push(new Promise((resolve, reject) => {
                req.db.collection("users").findOne({username: username}, {password: 0, _id: 0}, function(err, user) {
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

router.get('/notifs', function (req, res) {
  console.log("GET /notifs");
  if (!req.session.username)
  {
    res.redirect('/');
    return;
  }
    if (req.session.username) {
      req.db.collection("users").findOne({username: req.session.username}, {notification: 1}, function(err, me) {
          var notifs = [];
          if (me && me.notification) {
            notifs = me.notification;
          }
          res.json(notifs);
      });

    }
});

router.get('/disconnect', function (req, res) {
  if (req.session) {
    req.session.destroy(function (err) {
      res.redirect('/');
    });
  } else {res.redirect('/');}
});

router.get('/chat', function (req, res) {
    res.render(__dirname + '/../views/templates/chat.ejs');
});

module.exports = router;
