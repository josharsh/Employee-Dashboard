var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer({dest: './uploads'});
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
const fs = require('fs');
var User = require('../models/user');
const csv = require('fast-csv');
const csvtojson = require("csvtojson");
var mongodb = require('mongodb');
var mongoose = require('mongoose');

/* GET users listing. */
var counter=0;
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/getCount', function(req, res, next) {
	res.render('flow',{ count: counter });
  });
router.get('/register', function(req, res, next) {
  res.render('register2',{title:'Register'});
});
router.get('/login', function(req, res, next) {
  res.render('login', {title:'Login'});
});

router.post('/login',
  passport.authenticate('local',{failureRedirect:'/users/login', failureFlash: 'Invalid username or password'}),
  function(req, res) {
   req.flash('success', 'You are now logged in');
   res.redirect('/home');
});

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(function(username, password, done){
  User.getUserByUsername(username, function(err, user){
    if(err) throw err;
    if(!user){
      return done(null, false, {message: 'Unknown User'});
    }

    User.comparePassword(password, user.password, function(err, isMatch){
      if(err) return done(err);
      if(isMatch){
        return done(null, user);
      } else {
        return done(null, false, {message:'Invalid Password'});
      }
    });
  });
}));
router.post('/', upload.single('file'), function (req, res) {
  
});

router.post('/uploadFile', upload.single('csvData') ,function(req, res, next) {
 if(req.file){
  	console.log('Uploading File...');
  	var profileimage = req.file.filename;
  } else {
    console.log('No File Uploaded...');
    req.flash('error', 'There was an error uploading the file.');
  }
  console.log("Validating Form")
  // Form Validator
  // req.checkBody('#csvData','CSV is required to upload').notEmpty();

  // Check Errors
  console.log("Checking Errors")
  var errors = req.validationErrors();
  if(errors){
  	res.render('flow', {
      errors: errors,
      counter:counter
    });
    console.log("errors found")
    console.log(errors);
    return;
  }
  else {
  console.log("Uploaded")
  const fileRows = [];
  
  // open uploaded file
  csv.parseFile(req.file.path)
    .on("data", function (data) {
      
      fileRows.push({
        name: data[0],
        age: data[1],
        address: data[2],
        contact: data[3],
        username: data[4]}
      ); // push each row
    })
    .on("end", function () {
      
      console.log(fileRows.length);
      console.log("-----------------------------------------------------------------------------------------------------")
      var total = fileRows.length;
      var progress = 0;
      mongodb.connect(
        "mongodb://harsh:harsh@cluster0-shard-00-00.co22d.mongodb.net:27017,cluster0-shard-00-01.co22d.mongodb.net:27017,cluster0-shard-00-02.co22d.mongodb.net:27017/nodeauth?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority",
        { useNewUrlParser: true, useUnifiedTopology: true },
        (err, client) => {
          if (err) throw err;
          var count=0;
          for(var i=1;i<fileRows.length;++i){
            counter++;
            progress=(counter/total)*100;
            client
            .db("atlan-data")
            .collection("csv")
            .insertOne(fileRows[i], (err, res) => {
              if (err) {
                //console.log("Hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh");
                throw err;
              }
              //progress++;
              var perc = parseInt((counter/total)*100);
              console.log("Progressed: "+progress+"%");
              console.log(`Inserted: ${res.insertedCount} rows`);
            });
          } 
         }
        //client.close();
        );
      fs.unlinkSync(req.file.path);   // remove temp file
      //process "fileRows" and respond
    });
  setTimeout(()=>{res.location('/');
  res.redirect('/');},5000);
  }
  
});
router.post('/register', upload.single('profileimage') ,function(req, res, next) {
  var name = req.body.name;
  var email = req.body.email;
  var username = req.body.username;
  var password = req.body.password;
  var password2 = req.body.password2;

  if(req.file){
  	console.log('Uploading File...');
  	var profileimage = req.file.filename;
  } else {
  	console.log('No File Uploaded...');
  	var profileimage = 'noimage.jpg';
  }

  // Form Validator
  req.checkBody('name','Name field is required').notEmpty();
  req.checkBody('email','Email field is required').notEmpty();
  req.checkBody('email','Email is not valid').isEmail();
  req.checkBody('username','Username field is required').notEmpty();
  req.checkBody('password','Password field is required').notEmpty();
  req.checkBody('password2','Passwords do not match').equals(req.body.password);

  // Check Errors
  var errors = req.validationErrors();

  if(errors){
  	res.render('register', {
  		errors: errors
  	});
  } else{
  	var newUser = new User({
      name: name,
      email: email,
      username: username,
      password: password,
      profileimage: profileimage
    });

    User.createUser(newUser, function(err, user){
      if(err) throw err;
      console.log(user);
    });

    req.flash('success', 'You are now registered and can login');

   // res.location('/');
   // res.redirect('/');
  }
});

router.get('/logout', function(req, res){
  req.logout();
  req.flash('success', 'You are now logged out');
  res.redirect('/users/login');
});

router.get('/about', function(req, res){
  res.render('about');
});

module.exports = router;
