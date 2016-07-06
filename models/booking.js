"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var bookingSchema = new Schema({
    userId: String,
    name: String,
    dateOfRequest: String,
    startDate: String,
    endDate: String,
    totalDays: String,
    authorisation1: Boolean,
    authorisation2: Boolean,
    status: String
});


module.exports = mongoose.model('Booking', bookingSchema);