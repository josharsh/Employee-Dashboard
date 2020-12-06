var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer({ dest: './uploads' });
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
const fs = require('fs');
var flash = require('connect-flash');
var User = require('../models/user');
const csv = require('fast-csv');
var bodyParser = require('body-parser');
const csvtojson = require("csvtojson");
var mongodb = require('mongodb');
var mongoose = require('mongoose');


/* GET users listing. */
var counter = 0;
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

router.get('/register', function (req, res, next) {
  res.render('register2', { title: 'Register' });
});
router.get('/login', function (req, res, next) {
  res.render('login', { title: 'Login' });
});

router.post('/login',
  passport.authenticate('local', { failureRedirect: '/users/login', failureFlash: 'Invalid username or password' }),
  function (req, res) {
    req.flash('success', 'You are now logged in');
    res.redirect('/home');
  });

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.getUserById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(function (username, password, done) {
  User.getUserByUsername(username, function (err, user) {
    if (err) throw err;
    if (!user) {
      return done(null, false, { message: 'Unknown User' });
    }

    User.comparePassword(password, user.password, function (err, isMatch) {
      if (err) return done(err);
      if (isMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Invalid Password' });
      }
    });
  });
}));


router.post('/uploadData', function (req, res, next) {

  console.log("Checking Errors")
  var errors = req.validationErrors();
  if (errors) {
    res.render('flow', {
      errors: errors,
      counter: counter
    });
    console.log("errors found")
    console.log(errors);
    return;
  }
  else {
    console.log(req.body.length);
    console.log("-----------------------------------------------------------------------------------------------------")
    var total = req.body.length;
    var progress = 0;
    mongodb.connect(
      "mongodb://harsh:harsh@cluster0-shard-00-00.co22d.mongodb.net:27017,cluster0-shard-00-01.co22d.mongodb.net:27017,cluster0-shard-00-02.co22d.mongodb.net:27017/nodeauth?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority",
      { useNewUrlParser: true, useUnifiedTopology: true },
      (err, client) => {
        if (err) throw err;
        var count = 0;
        try {
          client
            .db("plum-data")
          .collection("csv")
          .insertMany(req.body, function (err, result) {
            if (err) {
              console.log(typeof (err));
              console.log("*************************************");
              console.log(err);
              console.log("*************************************");
              res.send("Failure" + "*" + err.writeErrors[0].errmsg);
            }
            else {
              console.log('Success');
              res.send("Success * Data Uploaded Successfully");
            }

          });
        } catch (e) {
          console.log(e);
        }
      });

  }
});
router.get('/logout', function (req, res) {
  req.logout();
  req.flash('success', 'You are now logged out');
  res.redirect('/users/login');
});

router.get('/about', function (req, res) {
  res.render('about');
});

module.exports = router;
