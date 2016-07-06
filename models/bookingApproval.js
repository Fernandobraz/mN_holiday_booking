var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var bookingApprovalSchema = new Schema({
    directorId: String,
    directorName: String,
    date: String,
    bookingId: String,
    approvalNum: String,
    decision: String
});


module.exports = mongoose.model('BookingApproval', bookingApprovalSchema);