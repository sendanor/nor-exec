/* Execute commands library */

"use strict";

function safe_require (name, defaultValue) {
	try {
		return require(name);
	} catch (err) {
		return defaultValue;
	}
}

var Q = require('q');
var _ = require('lodash');
var debug = safe_require('nor-debug', undefined);

/**
 * Return promise of a spawned command.
 *
 * @param command {string}
 * @param args {Array.<string>}
 * @param options {{env: {}, detached: boolean, stdio: Array.<string>}}
 * @param traits {stdout: boolean, stderr: boolean, disconnect: boolean, unref: boolean}
 * @return {Promise.<{retval: number, stdout:string, stderr: string}|string>}
 */
module.exports = function spawnProcess(command, args, options, traits) {
	options = options || {};
	traits = traits || {};
	var defer = Q.defer();

	if (debug && process.env.NOR_EXEC_DEBUG !== undefined) {
		debug.log('command = ', command);
		debug.log('args = ', args);
		debug.log('options = ', options);
	}

	options.env = _.merge({}, process.env, options.env || {});

	if (options.detached === undefined) {
		options.detached = true;
	}

	if (!options.stdio) {
		traits.stdout = true;
		traits.stderr = true;
		options.stdio = ["ignore", "pipe", "pipe"];
	}

	var stdout = '';
	var stderr = '';

	// Run the process
	var proc = require('child_process').spawn(command, args, options);

	if (traits.stdout) {g
		proc.stdout.setEncoding('utf8');
		proc.stdout.on('data', function(data) {
			stdout += data;
		});
	}

	if (traits.stderr) {
		proc.stderr.setEncoding('utf8');
		proc.stderr.on('data', function(data) {
			stderr += data;
		});
	}

	// Handle exit
	if (!(options.detached && traits.unref)) {
		proc.on('close', function(retval) {
			if (retval === 0) {
				defer.resolve({"retval": retval, "stdout": stdout, "stderr": stderr});
			} else {
				defer.reject({"retval": retval, "stdout": stdout, "stderr": stderr});
			}
		});

		// Handle error
		proc.on('error', function (err){
			defer.reject(err);
		});
	}

	if (traits.disconnect && proc.connected) {
		proc.disconnect();
	}

	if (traits.unref) {
		proc.unref();
	}

	// If command started detached and unref enabled; not waiting for it to finish.
	if (options.detached && traits.unref) {
		defer.resolve({});
	}

	defer.promise.CHILD = proc;

	return defer.promise;
};

/* EOF */
