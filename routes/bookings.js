"use strict";
var express         = require('express');
var router          = express.Router();
var moment          = require('moment');
var bodyParser      = require('body-parser')
var Booking         = require('../models/booking');
var User            = require('../models/user');
var BookingApproval = require('../models/bookingApproval');
var authorisations  = require('../helpers/authorisations');
var today           = moment();


// =========================================================
// =============== New and Create Booking ==================
// =========================================================

router.get('/new', authorisations.isLoggedIn, function(req, res, next) {
  res.render('bookings/new.ejs', { today: today, currentUser : req.user });
});

router.post('/register', authorisations.isLoggedIn, function(req, res){
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
    var message = "You forgot some fields! Try again.";
    res.render('bookings/new.ejs', { today: today, currentUser : req.user, message: message, name: name });
  }else if(moment(startDate).diff(moment(endDate), 'days') > 0 || moment(startDate).diff(moment(dateOfRequest)) < 0){
    var message = "The dates selected are invalid! Try again.";
    res.render('bookings/new.ejs', { today: today, currentUser : req.user, message: message, name: name });
  }else if(parseInt(currentUser.holidaysLeft) - parseInt(totalDays) < 0){
    var message = "You do not have that many holidays left.";
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
      res.redirect("/bookings/personal_requests");
    });
  }
});

// =========================================================
// ================== Delete Booking =======================
// =========================================================

router.get('/delete/:id', authorisations.isLoggedIn, function(req, res){
    Booking.findById(req.params.id, function(err, booking){
      if(err){
        res.status(err.status || 500);
        res.render('error', {
          message: err.message,
          error: err
        });
      }

      if(booking.status === "pending"){
        booking.remove({}, function(err){
          if (err) {
              res.statusCode = 403;
              res.send(err);
          } else {
            res.location("personal_requests");
            res.redirect("/bookings/personal_requests");
          }
        });
      }else{
        res.status(err.status || 500);
        res.render('error', {
          message: "You are trying to remove a record via a suspicius action.",
          error: "Unauthorised Action"
        });
      }
    });
  });

// =========================================================
// ================== Personal Bookings ====================
// =========================================================

router.get('/personal_requests', authorisations.isLoggedIn, function(req, res){
  var currentUser = req.user;
  Booking.find({userId: currentUser._id}, function(err, bookings) {
			if(err) throw err;
				
  			res.render('bookings/personalRequests.ejs', {
  				currentUser: currentUser,
          bookings: bookings,
          moment: moment
  			});
      //res.json(bookings);
			});
});

// =========================================================
// ============== Pending Bookings Requests ================
// =========================================================

router.get('/requests', authorisations.isLoggedIn, authorisations.isAdmin, function(req, res){
  Booking.find({ status: "pending" }, function(err, bookings) {
    if(err) throw err;
    
    res.render('bookings/index.ejs', {
      currentUser: req.user,
      bookings: bookings,
      moment: moment
    });
  });
});

// =========================================================
// ============== History of Booking Requests ==============
// =========================================================

router.get('/history', authorisations.isLoggedIn, authorisations.isAdmin, function(req, res){
  Booking.find({ status: { $in: ["accepted", "rejected"] } }, function(err, bookings) {
    if(err) throw err;
    
    res.render('bookings/history.ejs', {
      currentUser: req.user,
      bookings: bookings,
      moment: moment
    });
  });
});

// =========================================================
// ============== Approvals & Rejections ===================
// =========================================================

router.post('/approval/:approval_num', authorisations.isLoggedIn, authorisations.isAdmin, function(req, res){
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

router.post('/reject/:approval_num', authorisations.isLoggedIn, authorisations.isAdmin, function(req, res){
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

router.get('/decision/:id/:approval_num', authorisations.isLoggedIn, function(req, res){
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

router.get("/undo/:id", authorisations.isLoggedIn, authorisations.isAdmin, function(req, res){
  var bookingId = req.params.id;
  Booking.findById(bookingId, function(err, booking){
    if(err) throw err;
    var currentStatus = booking.status;
    booking.status = "pending";
    booking.authorisation1 = false;
    booking.authorisation2 = false;

    booking.save(function(err){
      if(err) throw err;

      BookingApproval.find({bookingId: booking._id}, function(err, apprBookings){
        if(err) throw err;

        apprBookings.forEach(function(apprbooking){
          apprbooking.remove({},function(){ console.log("deleting approval booking record...") });
        });
      });
      if(currentStatus === "accepted"){
        User.findById(booking.userId, function(err, user){
          if(err) throw err;

          user.holidaysLeft = parseInt(user.holidaysLeft) + parseInt(booking.totalDays) + "";
          user.save(function(err){
            if(err) throw err;

            console.log("user's holidays restored.");
          });
        });
      }
      res.redirect("/bookings/history");
    });
  });
});

module.exports = router;
