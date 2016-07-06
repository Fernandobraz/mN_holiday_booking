// var configValues = require('./config');
var mongoose = require('mongoose');
console.log("Connection to DB...");
var db = mongoose.connect('mongodb://localhost/holiday-booking');
module.exports = db;

// module.exports = {
//     getDbConnectionString: function(){
//         // return 'mongodb://' + configValues.uname + ':' + configValues.pwd + '@ds017852.mlab.com:17852/holiday-booking';
//     }
// }