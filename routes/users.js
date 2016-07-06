"use strict";
var User     = require('../models/user');
var mongoose = require('mongoose');

// app/routes.js
module.exports = function(app, passport) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    // app.get('/', function(req, res) {
    //     res.render('index.ejs'); // load the index.ejs file
    // });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/users/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('users/login.ejs', { message: req.flash('loginMessage') }); 
    });

    // process the login form
   app.post('/users/login', passport.authenticate('local-login', {
        successRedirect : '/', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/users/register', isLoggedIn, function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('users/new.ejs', {currentUser : req.user, message: req.flash('signupMessage') });
    });
		
		app.get('/users/edit/:id', isLoggedIn, function(req, res) {
			 User.findById({ _id: req.params.id }, function(err, user){
        if(err) throw err;

        res.render('users/edit.ejs', { currentUser : req.user, user: user, message: req.flash('signupMessage') });
    	}); 
		});
		
    // process the signup form
    app.post('/users/register', isLoggedIn, function(req, res) {
        var email = req.body.email;
        var firstName = req.body.firstName;
        var lastName = req.body.lastName;
        var admin = req.body.admin;
        var password = req.body.password;
		var holidaysLeft = req.body.holidays
        
        if(email === "" || firstName === "" || lastName === "") {
					message = "You forgot some fields! Try again.";
					res.render('users/new.ejs', {currentUser : req.user, message: message });
        }else{
					if(req.body.id){
						User.findByIdAndUpdate(req.body.id, {
							email : email,
							firstName : firstName,
							lastName : lastName,
							admin : admin,
							holidaysLeft : holidaysLeft
						}, function(err, user){
							if(err) throw err;
								
							res.redirect("/users");
						});
					}else{
						if(admin === ""){
							admin = false;
						}
						var newUser = User();
							newUser.email = email;
							newUser.firstName = firstName;
							newUser.lastName = lastName;
							newUser.admin = admin;
							newUser.password = newUser.generateHash(password);
							newUser.holidaysLeft = holidaysLeft;
						newUser.save(function(err){
							if(err) throw err;
							res.location("users");
							console.log(res.req.body);
							res.redirect("/users");
						});
					}
				}
    });
		
		
		app.get('/users', isLoggedIn, function(req, res) {
			var gotError = "";
			if(typeof(req.query.error) !== "undefined"){
				if(req.query.error === "001")
					gotError = "You cannot delete the logged in account."
			}
			User.find({}, function(err, users) {
				if(err) throw err;
				
				res.render('users/index.ejs', {
					users: users,
					currentUser: req.user,
					message: gotError
				});
			});
		});
    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/users/logout', function(req, res) {
        req.logout();
        res.redirect('/users/login');
    });
		
	app.get('/users/delete/:id', isLoggedIn, function(req, res){
		if(req.params.id === req.user.id){
			res.redirect("/users/?error=001");
		}else{
			User.findByIdAndRemove(req.params.id, function(err){
				if(err) throw err;
				
				res.location("users");
				res.redirect("/users");
			});
		}
	});
	app.get("/users/refresh", isLoggedIn, isAdmin, function(req, res){
		User.find({}, function(err, users){
			if(err) throw err;
			
			users.forEach(function(user){
				user.holidaysLeft = "28";
				user.save(function(err){
					if(err) throw err;
				});
			});
			
			res.redirect("/users")
		});
	});
};
function isAdmin(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.user.admin)
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}
// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/users/login');
}