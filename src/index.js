/* Execute commands library */

"use strict";

var Q = require('q');
var merge = require('merge');
var debug = require('nor-debug');

/**
 * Return promise of a spawned command
 */
module.exports = function spawnProcess(command, args, options) {
	options = options || {};
	var defer = Q.defer();

	debug.log('command = ', command);
	debug.log('args = ', args);
	debug.log('options = ', options);

	options.env = merge(process.env, options.env || {});
	options.detached = true;
	options.stdio = ["ignore", "ignore", "pipe"];

	var stderr = '';

	// Run the process
	var proc = require('child_process').spawn(command, args, options);
	proc.stderr.setEncoding('utf8');
	proc.stderr.on('data', function(data) {
		stderr += data;
	});

	// Handle exit
	proc.on('close', function(retval) {
		if (retval === 0) {
			defer.resolve(retval);
		} else {
			defer.reject({"retval": retval, "stderr": stderr});
		}
	});

	// Handle error
	proc.on('error', function(err){
		defer.reject(err);
	});

	return defer.promise;
};

/* EOF */
