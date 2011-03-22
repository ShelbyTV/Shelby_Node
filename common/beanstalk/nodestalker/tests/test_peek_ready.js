var assert = require('assert');
var bs = require('../lib/beanstalk_client');

console.log('testing put, peek_ready, delete');

var client = bs.Client();

var success = false;
var error = false;

client.put('test').onSuccess(function(data) {
	console.log(data);
	var test_id = data[0];
	
	client.peek_ready().onSuccess(function(data) {
		console.log(data);
		assert.ok(data);
		assert.equal(data.id, test_id);
		assert.equal(data.data, 'test');
		assert.equal(typeof data, 'object');
		success = true;
		
		client.deleteJob(test_id).onSuccess(function() {
			client.disconnect();
		});
	});
});

client.addListener('error', function() {
	error = true;
});

process.addListener('exit', function() {
	assert.ok(!error);
	assert.ok(success);
	console.log('test passed');
});