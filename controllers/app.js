var session = require('express-session');
//var sharedsession = require("express-socket.io-session");
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = module.exports.io = require('socket.io')(http);
var path = require('path');
var assert = require('assert');

var mongodb = require('mongodb');

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

// ------------------------------------------ //

app.post('/login', function (req, res) {

  mongodb.MongoClient.connect("mongodb://localhost:27017/matcha", function(err, db) {
    assert.equal(null, err);
    assert.ok(db != null);
    db.collection("users").findOne({username: req.body.username}, {location:1, password: 1, _id: 0}, function(err, doc) {
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
         } else {[]
          req.session.username = req.body.username;
          if (!doc.location || doc.location === "") {
            console.log("NO LOCATION SAVED : ", doc);
            users.saveIpLocation(db, req, res);
          } else {
            res.redirect('/');
          }
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
        console.log("*** LIKE REQUEST");
        db.collection("users").findOne(
          {username: req.session.username},
          {like: 1, profile_pic: 1},
          function(err, user) {
            if (user.profile_pic
                && user.profile_pic !== ""
                && user.like
                && user.like.indexOf(req.body.content) !== -1) // If already liked
            {
              db.collection("users").update( // Remove from like list
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
              db.collection("users").update(
                { username: req.body.content },
                { $push: {"notification": message} },
                { upsert : true }
              );

            } else {

              db.collection("users").update(
                {username: req.session.username},
                {$push: {like: req.body.content}},
                { upsert : true }
              );

              db.collection("users").findOne(
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

                  db.collection("users").update(
                    {username: req.body.content},
                    {$push: {"history": "<a href='/user?username=" + req.session.username + "'>Liked by " + req.session.username + "</a>"},
                     $push: {"notification": message},
                     $inc: {'popularity': 2}},
                     { upsert : true }
                  );

                });

            }
          });
        break;
        case "block":
          db.collection("users").update(
            {username: req.session.username},
            {$push: {block: req.body.content}},
            { upsert : true }
          );
          break;
        case "report":
          db.collection("users").findOne(
            {username: req.body.content}, {}, function (err, user) {
              if (user && user.report && user.report.indexOf(req.session) == -1) {

                if (user.report.length > 3)  {
                  db.collection("users").RemoveOne( {username: req.body.content} );

                } else {

                  db.collection("users").Update(
                    {username: req.body.content},
                    {$push: {report: req.session.username}},
                    { upsert : true }
                  );

                }
              }
            }
          );

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

app.post('/message', function (req, res) {
  var to = req.body.to,
  from = req.session.username,
  msg = req.body.msg;
  if (to && from && msg) {
    var message = {to: to, from: from, message: msg};
    users.likeEachOther(from, to, function (like) {
      if (like === true) {
        users.saveMessage(message);

      db.collection("users").findOne(
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
    });
  }
});

app.get('/message', function (req, res) {
  var user = req.query.user,
  msg = req.query.msg;

  console.log("GET MESSAGES WITH " + user);
  users.getMessages(req.session.username, user, function(messages) {
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

http.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
