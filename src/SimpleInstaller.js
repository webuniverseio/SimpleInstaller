'use strict';

var fs = require('fs');
var co = require('co');
var shelljs = require('shelljs');
var request = require('request');
var ShellErrorHandler = require('./ShellErrorHandler');
var shellHandler = new ShellErrorHandler(shelljs);
require('colors');

module.exports = SimpleInstaller;

/**
 * @param {{?link: string, name: string, ?tempFolder: string,
  * ?installMessage: string, ?prefix: string, ?postfix: string}} info
 * @class SimpleInstaller
 */
function SimpleInstaller(info) {
	this.skipDownload = !info.link;
	this.info = info;
	this.name = info.name;
	this.tempFolder = info.tempFolder || SimpleInstaller.tempFolder;
	this.installMessage = info.installMessage || 'installing ' + info.name;
}
/**
 * @type {string}
 */
SimpleInstaller.tempFolder = 'temp';
SimpleInstaller.prototype.run = function* () {
	if (!this.isInstalled()) {
		yield this.chooseInstallProcess();
	} else {
		console.log((this.name + ' ok').green);
		yield this.runUpdateIfExists();
	}
};
SimpleInstaller.prototype.isInstalled = function () {
	return !!shelljs.which(this.name);
};
SimpleInstaller.prototype.runUpdateIfExists = function* () {
	var info = this.info;
	/* istanbul ignore else  */
	if (info.update) {
		console.log(('running update for ' + this.name).cyan);
		yield info.update();
	}
};
SimpleInstaller.prototype.chooseInstallProcess = function* () {
	if (this.skipDownload) {
		this.installProgram();
	} else {
		yield this.downloadAndInstall();
	}
};
SimpleInstaller.prototype.downloadAndInstall = function* () {
	var tempFolder = this.tempFolder;
	if (!shelljs.test('-d', tempFolder)) {
		shelljs.mkdir(tempFolder);
		shellHandler.throwIfHasErrors('can\'t create a ' + tempFolder + ' folder');
	}
	yield this.downloadProgram();
	shellHandler.throwIfHasErrors('can\'t download ' + this.name);
	this.installProgram();
};
SimpleInstaller.prototype.downloadProgram = function* () {
	var info = this.info;
	console.log(('downloading ' + info.name + ', it might take a while, please be patient').cyan);
	yield download.bind(null, info.link, this.tempFolder + '/' + info.name);
};
SimpleInstaller.prototype.installProgram = function () {
	var info = this.info;
	console.log(this.installMessage.cyan);
	var prefix = valueOrFallback(info.prefix, '');
	var postfix = valueOrFallback(info.postfix, '');
	var command = prefix + info.name + postfix;
	if (!this.skipDownload) {
		command = 'cd ' + this.tempFolder + '&&' + command;
	}
	shelljs.exec(command);
	shellHandler.throwIfHasErrors('can\'t install program ' + info.name);
};
SimpleInstaller._simulateFsError = false;

function valueOrFallback(value, fallback) {
	return value || fallback;
}

function download(url, dest, cb) {
	var file = fs.createWriteStream(dest);
	file.on('finish', function() {
		file.close(cb);
	});
	function deleteFile(err) { // Handle errors
		// Delete the file async. (But we don't check the result)
		console.log(err);
		//noinspection JSUnresolvedFunction
		co(function* () {
			if (SimpleInstaller._simulateFsError) {
				throw new Error('Simulated file system error');
			}
			var deleteFile = fs.unlink.bind(fs, dest);
			var closeFs = file.close.bind(file);
			yield [deleteFile, closeFs];
			cb(err);
		}).catch(function (fsError) {
			console.log(fsError);
			fsError.file = file;
			cb(fsError);
		});
	}
	request(url)
		.on('error', deleteFile)
		.on('response', function (response) {
			if (response.statusCode !== 200) {
				deleteFile(new Error('Issue with downloading ' + url + ', status: ' + response.statusMessage));
			}
		})
		.pipe(file);
}