'use strict';

var fs = require('fs');
var co = require('co');
var shell = require('shelljs');
var request = require('request');
var ShellErrorHandler = require('./ShellErrorHandler');
var shellHandler = new ShellErrorHandler(shell);
require('colors');

module.exports = SimpleInstaller;

/**
 * @param {{installerInfo: {}}} params
 * @class SimpleInstaller
 */
function SimpleInstaller(params) {
	var info = params.installerInfo;
	this.skipDownload = !info.link;
	this.installerInfo = info;
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
		shell.echo((this.name + ' ok').green);
		yield this.runUpdateIfExists();
	}
};
SimpleInstaller.prototype.isInstalled = function () {
	return !!shell.which(this.name);
};
SimpleInstaller.prototype.runUpdateIfExists = function* () {
	var installerInfo = this.installerInfo;
	/* istanbul ignore else  */
	if (installerInfo.update) {
		shell.echo(('running update for ' + this.name).cyan);
		yield installerInfo.update();
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
	if (!shell.test('-d', tempFolder)) {
		shell.mkdir(tempFolder);
		shellHandler.throwIfHasErrors('can\'t create a ' + tempFolder + ' folder');
	}
	yield this.downloadProgram();
	shellHandler.throwIfHasErrors('can\'t download ' + this.name);
	shell.exec('cd ' + tempFolder);
	this.installProgram();
};
SimpleInstaller.prototype.downloadProgram = function* () {
	var installerInfo = this.installerInfo;
	shell.echo(('downloading ' + installerInfo.name + ', it might take a while, please be patient').cyan);
	yield download.bind(null, installerInfo.link, this.tempFolder + '/' + installerInfo.name);
};
SimpleInstaller.prototype.installProgram = function () {
	var installerInfo = this.installerInfo;
	shell.echo(this.installMessage.cyan);
	var prefix = installerInfo.prefix || '';
	var postfix = installerInfo.postfix || '';
	shell.exec(prefix + installerInfo.name + postfix);
	shellHandler.throwIfHasErrors('can\'t install program ' + installerInfo.name);
};
SimpleInstaller._simulateFsError = false;

function download(url, dest, cb) {
	var file = fs.createWriteStream(dest);
	file.on('finish', function() {
		file.close(cb);
	});
	function deleteFile(err) { // Handle errors
		// Delete the file async. (But we don't check the result)
		console.log(err);
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