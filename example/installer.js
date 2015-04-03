//jshint node:true, esnext: true
'use strict';

var co = require('co');
/**
 * @type {SimpleInstaller|function}
 */
var SimpleInstaller = require('simple-installer');
var shelljs = require('shelljs');
/**
 * @type {_.LoDashStatic}
 */
var _ = require('lodash');
var ShellErrorHandler = require('simple-installer/src/ShellErrorHandler');
var shellHandler = new ShellErrorHandler(shelljs);
var config = require('./config');
var simpleInstalls = [
	{
		command: 'SET PATH=%PATH%;c:\\Git\\bin\\&&bower install',
		errorMessage: 'some bower modules failed to install'
	}
];

/**
 * @callback runInstaller
 * @param {Object} info
 */
function* runInstaller(info) {
	var installer = new SimpleInstaller(info);
	if (!info.condition || info.condition()) {
		yield installer.run();
	}
}

/**
 * @param {Object} setup
 */
function runSimpleSetup(setup) {
	console.log(setup.command.cyan);
	shelljs.exec(setup.command);
	shellHandler.throwIfHasErrors(setup.errorMessage);
}

//noinspection JSUnresolvedFunction
/**
 * @callback runCoroutine
 */
co(function* runCoroutine() {
	var setup = _.map(config, runInstaller);

	for (var i = 0, length = setup.length; i < length; i++) {
		yield setup[i];
	}

	_.each(simpleInstalls, runSimpleSetup);

	shelljs.rm('-rf', SimpleInstaller.tempFolder);
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