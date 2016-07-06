var chai = require('chai');
var chaiHttp = require('chai-http');
var app = require('../app');
var should = chai.should();

chai.use(chaiHttp);


describe('Blobs', function() {
  it('should list ALL bookings on /blobs GET', function(done){
  	chai.request(app)
    .post('/bookings/register')
    .send({
    	'userId': '1',
	    'name': 'Java', 
	    'dateOfRequest': '2016-07-01', 
	    'startDate': '2016-07-05', 
	    'endDate': '2016-07-08', 
	    'totalDays': '3'
 	})
    .end(function(err, res){
      res.should.have.status(200);
      res.should.be.html;
      res.body.should.be.a('object');
      console.log(res.body, "log here");
      res.body.should.have.property('SUCCESS');
      // res.body.SUCCESS.should.be.a('object');
      // res.body.SUCCESS.should.have.property('name');
      // res.body.SUCCESS.should.have.property('lastName');
      // res.body.SUCCESS.should.have.property('_id');
      // res.body.SUCCESS.name.should.equal('Java');
      // res.body.SUCCESS.lastName.should.equal('Script');
      done();
    });
  });
  it('should list a SINGLE blob on /blob/<id> GET');
  it('should add a SINGLE blob on /blobs POST');
  it('should update a SINGLE blob on /blob/<id> PUT');
  it('should delete a SINGLE blob on /blob/<id> DELETE');
});