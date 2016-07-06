"use strict";
var express = require('express');
var router = express.Router();
var moment = require('moment');
var bodyParser = require('body-parser')
var Booking = require('../models/booking');
var User = require('../models/user');
var BookingApproval = require('../models/bookingApproval');
var today = moment();

/* GET home page. */

router.get('/new', isLoggedIn, function(req, res, next) {
  res.render('bookings/new.ejs', { today: today, currentUser : req.user });
});

router.post('/register', isLoggedIn, function(req, res){
  var currentUser = req.user;
  var userId = req.body.userId;
  var name = req.body.name;
  var dateOfRequest = req.body.dateOfRequest;
  var startDate = req.body.startDate;
  var endDate = req.body.endDate;
  var totalDays = req.body.totalDays;
  var authorisation1 = false;
  var authorisation2 = false;
  var status = "pending";
  
  if(startDate === "" || endDate === "") {
    message = "You forgot some fields! Try again.";
    res.render('bookings/new.ejs', { today: today, currentUser : req.user, message: message, name: name });
  }else if(moment(startDate).diff(moment(endDate), 'days') > 0 || moment(startDate).diff(moment(dateOfRequest)) < 0){
    message = "The dates selected are invalid! Try again.";
    res.render('bookings/new.ejs', { today: today, currentUser : req.user, message: message, name: name });
  }else if(parseInt(currentUser.holidaysLeft) - parseInt(totalDays) < 0){
    message = "You do not have that many holidays left.";
    res.render('bookings/new.ejs', { today: today, currentUser : req.user, message: message, name: name });
  }else{
    var newBooking = Booking();
      newBooking.userId = userId;
      newBooking.name = name;
      newBooking.dateOfRequest = dateOfRequest;
      newBooking.startDate = startDate;
      newBooking.endDate = endDate;
      newBooking.totalDays = totalDays;
      newBooking.authorisation1 = authorisation1;
      newBooking.authorisation2 = authorisation2;
      newBooking.status = status;
    newBooking.save(function(err){
      
      if(err) throw err;
      console.log(res.req);
      res.sendStatus(200);
      res.redirect("/bookings/personal_requests");
    });
  }
});

router.get('/personal_requests', isLoggedIn, function(req, res){
  var currentUser = req.user;
  Booking.find({userId: currentUser._id}, function(err, bookings) {
			if(err) throw err;
				
        console.log(res.req.body);
  			res.render('bookings/personalRequests.ejs', {
  				currentUser: currentUser,
          bookings: bookings,
          moment: moment
  			});
      //res.json(bookings);
			});
});

router.get('/requests', isLoggedIn, isAdmin, function(req, res){
  Booking.find({ status: "pending" }, function(err, bookings) {
    if(err) throw err;
    
    res.render('bookings/index.ejs', {
      currentUser: req.user,
      bookings: bookings,
      moment: moment
    });
  });
});
router.get('/history', isLoggedIn, isAdmin, function(req, res){
  Booking.find({ status: { $in: ["accepted", "rejected"] } }, function(err, bookings) {
    if(err) throw err;
    
    res.render('bookings/history.ejs', {
      currentUser: req.user,
      bookings: bookings,
      moment: moment
    });
  });
});
router.post('/approval/:approval_num', isLoggedIn, isAdmin, function(req, res){
  var currentUser = req.user;
  var bookingId = req.body.id;
  var approvalNum = req.params.approval_num;
  
  var newBookingApproval = BookingApproval();
  newBookingApproval.directorId = currentUser.id;
  newBookingApproval.directorName = currentUser.firstName + " " + currentUser.lastName;
  newBookingApproval.date = today.format('YYYY-MM-DD');
  newBookingApproval.bookingId = bookingId;
  newBookingApproval.approvalNum = approvalNum;
  newBookingApproval.decision = "approved";
  
  newBookingApproval.save(function(err){
    if(err) throw err;
    Booking.findById(bookingId, function(err, booking){
      if(approvalNum === "1"){
        booking.authorisation1 = true;
      }else if(approvalNum === "2"){
        booking.authorisation2 = true;        
      }
      if(booking.authorisation1 === true && booking.authorisation2 === true){
        User.findById(booking.userId, function(err, user){
          if(err) throw err;
          
          var newHolidaysLeft = parseInt(user.holidaysLeft) - parseInt(booking.totalDays);
          
          user.holidaysLeft = newHolidaysLeft;
          user.save(function(err){
            if(err) throw err;
          });
        });
        booking.status = "accepted";
        
      }
      booking.save(function(err){
        if(err) throw err;
        
        res.redirect("/bookings/requests");
      });
    });
  });
});
router.post('/reject/:approval_num', isLoggedIn, isAdmin, function(req, res){
  var currentUser = req.user;
  var bookingId = req.body.id;
  var approvalNum = req.params.approval_num;
  
  var newBookingApproval = BookingApproval();
  newBookingApproval.directorId = currentUser.id;
  newBookingApproval.directorName = currentUser.firstName + " " + currentUser.lastName;
  newBookingApproval.date = today.format('YYYY-MM-DD');
  newBookingApproval.bookingId = bookingId;
  newBookingApproval.approvalNum = approvalNum;
  newBookingApproval.decision = "rejected";
  
  newBookingApproval.save(function(err){
    if(err) throw err;
    Booking.findById(bookingId, function(err, booking){
      booking.status = "rejected";
      booking.save(function(err){
        if(err) throw err;
        
        res.redirect("/bookings/requests");
      });
    });
  });
});
router.get('/decision/:id/:approval_num', isLoggedIn, function(req, res){
  var bookingId = req.params.id;
  var approvalNum = req.params.approval_num;
  if(approvalNum === "0"){
    BookingApproval.find({ bookingId: bookingId, decision: "rejected" }, function(err, data){
      if(err) throw err;
      
      res.render('bookings/approval.ejs',{
        approvalInfo: data,
        currentUser: req.user
      });
    });
  }
  BookingApproval.find({ bookingId: bookingId, approvalNum: approvalNum }, function(err, data){
    if(err) throw err;
    
    res.render('bookings/approval.ejs',{
      approvalInfo: data,
      currentUser: req.user
    });
  });
});
router.get("/undo/:id", isLoggedIn, isAdmin, function(req, res){
  var bookingId = req.params.id;
  Booking.findById(bookingId, function(err, booking){
    if(err) throw err;
    // change the status to pending
    // set both approvals to false
    if(booking.status === "accepted"){
      // give back the days left to the user
    }else if(booking.status === "rejected"){
      
    }
  });
});
function isAdmin(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.user.admin)
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/users/login');
}
module.exports = router;
