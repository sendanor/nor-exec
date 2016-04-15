/* Execute commands library */

"use strict";

var Q = require('q');
var merge = require('merge');
var debug = require('nor-debug');

/**
 * Return promise of a spawned command
 */
module.exports = function spawnProcess(command, args, options, traits) {
	options = options || {};
	traits = traits || {};
	var defer = Q.defer();

	if(process.env.NOR_EXEC_DEBUG !== undefined) {
		debug.log('command = ', command);
		debug.log('args = ', args);
		debug.log('options = ', options);
	}

	options.env = merge(process.env, options.env || {});

	if(options.detached === undefined) {
		options.detached = true;
	}

	if(!options.stdio) {
		traits.stdout = true;
		traits.stderr = true;
		options.stdio = ["ignore", "pipe", "pipe"];
	}

	var stdout = '';
	var stderr = '';

	// Run the process
	var proc = require('child_process').spawn(command, args, options);

	if(traits.unref) {
		proc.unref();
	}

	if(traits.stdout) {
		proc.stdout.setEncoding('utf8');
		proc.stdout.on('data', function(data) {
			stdout += data;
		});
	}

	if(traits.stderr) {
		proc.stderr.setEncoding('utf8');
		proc.stderr.on('data', function(data) {
			stderr += data;
		});
	}

	// Handle exit
	if(options.detached && traits.unref) {
		defer.resolve("Command started detached and unref enabled; not waiting for it to finish.");
	} else {
		proc.on('close', function(retval) {
			if (retval === 0) {
				defer.resolve({"retval": retval, "stdout": stdout, "stderr": stderr});
			} else {
				defer.reject({"retval": retval, "stdout": stdout, "stderr": stderr});
			}
		});

		// Handle error
		proc.on('error', function(err){
			defer.reject(err);
		});
	}

	return defer.promise;
};

/* EOF */
