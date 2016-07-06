"use strict";
var express = require('express');
var router = express.Router();
var Booking = require('../models/booking');
var moment = require('moment');
var today = moment();

/* GET home page. */
router.get('/', function(req, res, next) {
  // res.render('index', { title: 'Express', currentUser : req.user });
  res.redirect('/bookings/personal_requests');
});

router.get('/calendar', isLoggedIn, function(req, res){
  var newestBookings = [];
  Booking.find({status: "accepted"}, null, { sort: { startDate: 'asc' } }, function(err, bookings){
    bookings.forEach(function(booking){
      if(moment(booking.endDate).diff(today, 'days') >= 0){
        newestBookings.push(booking);
      }
    });
    res.render('calendar.ejs', {
      currentUser: req.user,
      bookings: newestBookings,
      moment: moment
    })
  });
});
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/users/login');
}
module.exports = router;
