var session = require('express-session');
//var sharedsession = require("express-socket.io-session");
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = module.exports.io = require('socket.io')(http);

var path = require('path');
var assert = require('assert');

// -------         INCLUDES          -------- //
var mongodb = require('mongodb');

var user_funct = require('./user');

var _db;

app.all('*', function(req, res, next)
{
  if (!_db) {
    mongodb.MongoClient.connect("mongodb://localhost:27017/matcha", function(err, db) {
      assert.equal(null, err);
      assert.ok(db != null);

      req.db = db;
      _db = db;

      next();
    });
  } else {
    req.db = _db;
    next();
  }
});


// var db = module.exports.db;

// ------------------------------------------ //

var password = require('password-hash-and-salt');

var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({limit: '5mb'}));

app.set('view engine', 'ejs');


var sessionMiddleware = session({secret: 'ksljflksdfj',
resave: false,
saveUninitialized: false});

app.use(sessionMiddleware);

io.use(function(socket, next) {
  sessionMiddleware(socket.request, socket.request.res, next);
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, '/../public')));

app.use(express.static(path.join(__dirname, '/../views')));
console.log(__dirname + '/../public');




// -------         INCLUDES          -------- //

var users = require("./user");

app.use('/', require("./routes"));

require('./auth.js')(app);

// ------------------------------------------ //

var entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

function escapeHtml (string) {
  return String(string).replace(/[&<>"'`=\/]/g, function (s) {
    return entityMap[s];
  });
}



app.post('/login', function (req, res) {

  req.db.collection("users").findOne({username: req.body.username}, {location:1, password: 1, _id: 0}, function(err, doc) {
    assert.equal(err, null);
    if (!doc) {
      res.render(__dirname + '/../views/templates/index.ejs',
      {
        alert: true,
        alert_type: "alert-warning",
        alert_msg: "<strong>Warning !</strong> Bad username."
      });
      return;
    }
    password(req.body.password).verifyAgainst(doc.password, function(error, verified) {
      assert.equal(error, null);
      if (!verified) {
        res.render(__dirname + '/../views/templates/index.ejs',
        { alert: true,
          alert_type: "alert-warning",
          alert_msg: "<strong>Warning !</strong> Wrong password."
        });
      } else {
        req.session.username = req.body.username;

        req.db.collection("users").update(
          {username: req.session.username},
          {$set: {last_log: new Date()}}
        );

        if (!doc.location || doc.location === "") {
          console.log("NO LOCATION SAVED : ", doc);
          users.saveIpLocation(req.db, req, res);
        }
        res.redirect('/');
      }
    });
  });
});

app.post('/profile', function (req, res) {
  switch (req.body.field) {
    case "email":
    req.db.collection("users").update(
      {username: req.session.username},
      {$set: {email: req.body.content}}
    );
    res.end();
    break;
    case "biography":
    req.db.collection("users").update(
      {username: req.session.username},
      {$set: {biography: req.body.content}}
    );
    res.end();
    break;
    case "gender":
    req.db.collection("users").update(
      {username: req.session.username},
      {$set: {gender: req.body.content}}
    );
    res.end();
    break;
    case "sex_pref":
    req.db.collection("users").update(
      {username: req.session.username},
      {$set: {sex_pref: req.body.content}}
    );
    res.end();
    break;
    case "interests":
    req.db.collection("users").update(
      {username: req.session.username},
      {$set: {interests: req.body.content}}
    );
    res.end();
    break;
    case "firstname":
    req.db.collection("users").update(
      {username: req.session.username},
      {$set: {firstname: req.body.content}}
    );
    res.end();
    break;
    case "lastname":
    req.db.collection("users").update(
      {username: req.session.username},
      {$set: {lastname: req.body.content}}
    );
    res.end();
    break;
    case "age":
    if (isNaN(req.body.content) || req.body.content < 18 || req.body.content > 120)
      res.json({status: 500, message : "Age not valid"});
    else {
      req.db.collection("users").update(
        {username: req.session.username},
        {$set: {age: req.body.content}}
      );
      res.end();
    }
    break;
    case "picture":
    var obj = {};
    var field = 'picture' + req.body.index;
    obj[field] = req.body.content;

    req.db.collection("users").update(
      {username: req.session.username},
      {$set: obj}
    );
    res.end();
    break;
    case "profile_pic":
    req.db.collection("users").update(
      {username: req.session.username},
      {$set: {profile_pic: req.body.content}}
    );
    res.end();
    break;
    case "getNavLoc":
    console.log("NAV LOCATION");
    req.db.collection("users").findOne(
      {username: req.session.username}, function(err, user) {
        // console.log("USER : ", user);
        if (user && user.lat_lng)
          res.json({msg: 0});
        else
          res.json({msg: 1});
      });
    break;
    case "location":
    console.log("LOCATION");
    req.db.collection("users").update(
      {username: req.session.username},
      {$set: {location: req.body.content}}
    );
    res.end();
    break;
    case "lat_lng":
    req.db.collection("users").update(
      {username: req.session.username},
      {$set: {lat_lng: req.body.content}}
    );
    res.end();
    break;
    case "like":
    console.log("*** LIKE REQUEST");
    req.db.collection("users").findOne(
      {username: req.session.username},
      {like: 1, profile_pic: 1},
      function(err, user) {
        if (user.profile_pic
          && user.profile_pic !== ""
          && user.like
          && user.like.indexOf(req.body.content) !== -1) // If already liked
          {
            req.db.collection("users").update( // Remove from like list
              {username: req.session.username},
              {$pull: {like: req.body.content}}
            );

            var message = req.session.username + " unliked you";
            Object.keys(io.sockets.sockets).forEach(function(socket_id) {
              var user = io.sockets.sockets[socket_id];
              if (user.request.session.username === req.body.content) {
                io.to(socket_id).emit('notif', message);
              }
            });
            req.db.collection("users").update(
              { username: req.body.content },
              { $push: {"notification": message} }
            );

          } else {

            req.db.collection("users").update(
              {username: req.session.username},
              {$push: {like: req.body.content}}
            );

            req.db.collection("users").findOne(
              {username: req.body.content},
              {like: 1},
              function(err, user) {
                var message = req.session.username + " liked you";
                if (user
                  && user.like
                  && user.like.indexOf(req.session.username) !== -1) {
                    message = req.session.username + " liked you back";
                  }

                  Object.keys(io.sockets.sockets).forEach(function(socket_id) {
                    var user = io.sockets.sockets[socket_id];
                    if (user.request.session.username === req.body.content) {
                      io.to(socket_id).emit('notif', message);
                    }
                  });

                  req.db.collection("users").update(
                    {username: req.body.content},
                    {$push: {"history": "<a href='/user?username=" + req.session.username + "'>Liked by " + req.session.username + "</a>"},
                    $push: {"notification": message},
                    $inc: {'popularity': 2}}
                  );

                });

              }
            });
            res.end();
            break;
            case "block":
              if (req.body.content) {
                req.db.collection("users").findOne(
                  {username: req.session.username}, {}, function (err, user) {
                    if (user) {
                      if (!user.block || user.block.indexOf(req.body.content) === -1) {
                          req.db.collection("users").update(
                            {username: req.session.username},
                            {$push: {block: req.body.content}}
                          );
                      } else {
                        req.db.collection("users").update(
                          {username: req.session.username},
                          {$pull: {block: req.body.content}}
                        );
                      }
                    }
                  });
              }
            res.end();
            break;

            case "report":
            console.log("---------  REPORT");
            req.db.collection("users").findOne(
              {username: req.body.content}, {}, function (err, user) {
                if (user) {

                  if (!user.report || user.report.indexOf(req.session.username) === -1) {
                    if (user.report && user.report.length >= 3)  {
                      req.db.collection("users").deleteOne( {username: req.body.content} );
                    } else {
                      req.db.collection("users").update(
                        {username: req.body.content},
                        {$push: {report: req.session.username}}
                      );
                    }
                  } else {
                    req.db.collection("users").update(
                      {username: req.body.content},
                      {$pull: {report: req.session.username}}
                    );
                  }

                }
              });
            res.end();
            break;
          }
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

            if (!user_funct.securePass(pass)) {
                res.render(__dirname + '/../views/templates/index.ejs',
                {alert: true,
                  alert_type: "alert-warning",
                  alert_msg: "<strong>Warning !</strong> Password not secure," +
                  " it has to be at least 6 characters long and contain" +
                  " a number an uppercase and a lowercase letter."});
                  return;
                }

                password(pass).hash(function(error, hash) {

                  req.db.collection("users").count({username: username}, function(err, count) {
                    if (err)
                    throw err;
                    if (count == 0)
                    {
                      req.db.collection("users").insert
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
                    })
                  });

                  app.post('/message', function (req, res) {
                    var to = req.body.to,
                    from = req.session.username,
                    msg = req.body.msg;
                    if (to && from && msg) {
                      var message = {to: to, from: from, message: escapeHtml(msg)};
                      users.likeEachOther(req, from, to, function (like) {
                        if (like === true) {
                          users.saveMessage(req, message);

                          req.db.collection("users").findOne(
                            {username: req.body.to}, {}, function (err, user) {
                              if (!(user && user.block && user.block.indexOf(req.session) !== -1)) { // if not blocked by receiver then emit
                                Object.keys(io.sockets.sockets).forEach(function(socket_id) {
                                  var user = io.sockets.sockets[socket_id];
                                  if (user.request.session.username === to) {
                                    io.to(socket_id).emit('message', message);
                                  }
                                });
                              }
                            });
                          }
                          res.end();
                        });
                      }
                    });

                    app.get('/message', function (req, res) {
                      var user = req.query.user,
                      msg = req.query.msg;

                      console.log("GET MESSAGES WITH " + user);
                      users.getMessages(req, req.session.username, user, function(messages) {
                        console.log("MESSAGES : ", messages);
                        res.json(messages);
                      });

                    });



                    // io.on('connection', function(socket) {
                    //   console.log("NUMBER OF SOCKETS : " + Object.keys(io.sockets.sockets).length);
                    //
                    //   socket.on('message', function(msg) {
                    //     console.log("Chat msg");
                    //     io.emit('message', msg);
                    //   });
                    // });

                    http.listen(8080, function () {
                      console.log('Example app listening on port 8080!');
                    });
