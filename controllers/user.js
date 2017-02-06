var exports = module.exports = {};

exports.loadProfile = function (req, res) {
  mongodb.MongoClient.connect("mongodb://localhost:27017/matcha", function(err, db) {
    assert.equal(null, err);
    assert.ok(db != null);
    db.collection("users").findOne({username: req.session.username}, {password: 0, _id: 0}, function(err, doc) {
      console.log(doc);
      res.render(__dirname + '/public/main.ejs', doc);
    });
  });
}


exports.loadSuggestions = function (db, req, res) {
  db.collection("users").findOne({username: req.session.username}, {password: 0, _id: 0}, function(err, doc) {
    if (doc) {
      switch (doc.sex_pref) {
        case "Hetero":
          if (doc.gender === "Male") {
            console.log("DBG 1");
              db.collection("users").find({gender: "Female", username: {$ne: req.session.username}}, {password: 0, _id: 0}).toArray(function(err, doc) {
                res.render(__dirname + '/public/suggestions.ejs', {users: doc});
              });
          } else {
            console.log("DBG 2");
            db.collection("users").find({gender: "Male", username: {$ne: req.session.username}}, {password: 0, _id: 0}).toArray(function(err, doc) {
              res.render(__dirname + '/public/suggestions.ejs', {users: doc});
            });
          }
        break;
        case "Gay":
          if (doc.gender === "Male") {
            console.log("DBG 3");
            db.collection("users").find({gender: "Male", username: {$ne: req.session.username}}, {password: 0, _id: 0}).toArray(function(err, doc) {
              console.log(doc);
              res.render(__dirname + '/public/suggestions.ejs', {users: doc});
            });
          } else {
            console.log("DBG 4");
            db.collection("users").find({gender: "Female", username: {$ne: req.session.username}}, {password: 0, _id: 0}).toArray(function(err, doc) {
              res.render(__dirname + '/public/suggestions.ejs', {users: doc});
            });
          }
        break;
        default:
          console.log("DBG 5");
          db.collection("users").find({username: {$ne: req.session.username}}, {password: 0, _id: 0}).toArray(function(err, doc) {
            res.render(__dirname + '/public/suggestions.ejs', {users: doc});
          });
      }
    }
  });
}
