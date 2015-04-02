//jshint node:true, esnext: true
'use strict';

var co = require('co');
/**
 * @type {SimpleInstaller|function}
 */
var SimpleInstaller = require('SimpleInstaller');
/**
 * @type {shelljs}
 */
var shell = require('shelljs');
/**
 * @type {_.LoDashStatic}
 */
var _ = require('lodash');
var ShellErrorHandler = require('SimpleInstaller/src/ShellErrorHandler');
var shellHandler = new ShellErrorHandler(shell);
var config = require('./config');
var simpleInstalls = [
	{
		command: 'SET PATH=%PATH%;c:\\Git\\bin\\&&bower install',
		errorMessage: 'some bower modules failed to install'
	}
];

/**
 * @callback runInstaller
 * @param {Object} data
 */
function* runInstaller(data) {
	var installer = new SimpleInstaller({
		installerInfo: data
	});
	if (!data.condition || data.condition()) {
		yield installer.run();
	}
}

/**
 * @param {Object} setup
 */
function runSimpleSetup(setup) {
	console.log(setup.command.cyan);
	shell.exec(setup.command);
	shellHandler.throwIfHasErrors(setup.errorMessage);
}

/**
 * @callback runCoroutine
 */
co(function* runCoroutine() {
	var setup = _.map(config, runInstaller);

	for (var i = 0, length = setup.length; i < length; i++) {
		yield setup[i];
	}

	_.each(simpleInstalls, runSimpleSetup);

	shell.rm('-rf', SimpleInstaller.tempFolder);
	shellHandler.throwIfHasErrors(
		'can\'t delete a ' + SimpleInstaller.tempFolder + ' folder, try to delete it manually'
	);

	console.log('Installation finished'.yellow);
}).catch(function (ex) { // jshint ignore:line
	setTimeout(function throwUnhandledException() {
		console.log('setup failed'.red);
		console.log((ex.message ? ex.message : ex).red);
		throw ex;
	}, 0);
});