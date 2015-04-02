'use strict';

/**
 * @type {SimpleInstaller|exports|module.exports}
 */
var SimpleInstaller = require('../src/SimpleInstaller');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var co = require('co');
var should = require('should');
var shell = require('shelljs');
var ShellErrorHandler = require('../src/ShellErrorHandler');
var shellHandler = new ShellErrorHandler(shell);

describe('SimpleInstaller constructor', function () {
	it('should have following prototype methods', function() {
		_.each([
			'run', 'isInstalled', 'runUpdateIfExists', 'chooseInstallProcess',
			'downloadAndInstall', 'downloadProgram', 'installProgram'
		], function (method) {
			(typeof SimpleInstaller.prototype[method]).should.be.exactly('function');
		});
	});
	it('should have default temp folder', function() {
		SimpleInstaller.tempFolder.should.be.exactly('temp');
	});
	it('should have default _simulateFsError flag', function() {
		SimpleInstaller._simulateFsError.should.be.exactly(false);
	});
});
describe('SimpleInstaller instance', function () {
	it('should have proper installerInfo', function() {
		var info = {
			name: 'ruby'
		};
		new SimpleInstaller({installerInfo: info}).installerInfo.should.be.exactly(info);
		new SimpleInstaller({installerInfo: info}).name.should.be.exactly(info.name);
	});
	it('should change installMessage based on params', function() {
		var infoWithMessage = {
			installMessage: 'let me handle this',
			name: 'ruby'
		};
		var infoWithoutMessage = {
			name: 'ruby'
		};
		new SimpleInstaller({
			installerInfo: infoWithMessage
		}).installMessage.should.be.exactly(infoWithMessage.installMessage);
		new SimpleInstaller({
			installerInfo: infoWithoutMessage
		}).installMessage.should.be.exactly('installing ' + infoWithoutMessage.name);
	});
	it('should change skipDownload based on link existence', function() {
		var infoWithLink = {
			link: 'http://',
			name: 'ruby'
		};
		var infoWithoutLink = {
			name: 'ruby'
		};
		new SimpleInstaller({installerInfo: infoWithLink}).skipDownload.should.be.exactly(false);
		new SimpleInstaller({installerInfo: infoWithoutLink}).skipDownload.should.be.exactly(true);
	});
	it('should change tempFolder based on params', function() {
		var infoWithTempFolder = {
			tempFolder: 'custom',
			name: 'ruby'
		};
		var infoWithoutTempFolder = {
			name: 'ruby'
		};
		new SimpleInstaller({
			installerInfo: infoWithTempFolder
		}).tempFolder.should.be.exactly(infoWithTempFolder.tempFolder);
		new SimpleInstaller({
			installerInfo: infoWithoutTempFolder
		}).tempFolder.should.be.exactly(SimpleInstaller.tempFolder);
	});
	it('should verify if program is installed', function() {
		new SimpleInstaller({installerInfo: {
			name: 'node'
		}}).isInstalled().should.be.exactly(true);
		new SimpleInstaller({installerInfo: {
			name: 'i-dont-exist'
		}}).isInstalled().should.be.exactly(false);
	});
	it('should run update if exists', function(done) {
		co(function* () {
			//noinspection JSUnusedGlobalSymbols
			var info = {
				name: 'node',
				update: function* () {
					this.should.be.exactly(info);
					done();
				}
			};
			var installer = new SimpleInstaller({installerInfo: info});
			yield installer.runUpdateIfExists();
		});
	});
	describe('test install process', function () {
		it('should install and uninstall program', function(done) {
			this.timeout(15000);
			var info = {
				prefix: 'npm i ',
				name: 'simple-permissions'
			};
			var installer = new SimpleInstaller({installerInfo: info});
			installer.installProgram();

			(typeof require('simple-permissions').grant).should.be.exactly('function');

			var uninstallInfo = {
				installMessage: 'uninstalling simple-permissions',
				name: 'npm',
				postfix: ' uninstall simple-permissions'
			};
			var uninstaller = new SimpleInstaller({installerInfo: uninstallInfo});
			uninstaller.installProgram();

			should.throws(function () {
				delete require.cache[require.resolve('simple-permissions')];
				require('simple-permissions');
			}, Error, 'simple-permissions should not exist');

			done();
		});
	});
	describe('test download process', function () {
		before(function () {
			if (!shell.test('-d', SimpleInstaller.tempFolder)) {
				shell.mkdir(SimpleInstaller.tempFolder);
				shellHandler.throwIfHasErrors('can\'t create a ' + SimpleInstaller.tempFolder + ' folder');
			}
		});
		function cleanUp() {
			if (shell.test('-d', SimpleInstaller.tempFolder)) {
				shell.rm('-rf', SimpleInstaller.tempFolder);
				shellHandler.throwIfHasErrors(
					'can\'t delete a ' + SimpleInstaller.tempFolder + ' folder, try to delete it manually'
				);
			}
		}
		after(cleanUp);

		it('should download a file in temp folder', function(done) {
			this.timeout(15000);
			co(function* () {
				var installer = new SimpleInstaller({installerInfo: {
					link: 'https://github.com/arturadib/shelljs/archive/72e34fa881d6ffb9fb3ece2b89743b2c3df7f020.zip',
					name: 'shelljs.zip'
				}});
				yield installer.downloadProgram();
				var archiveDescriptor = yield fs.open.bind(fs, path.join(installer.tempFolder, installer.name), 'r');
				(typeof archiveDescriptor).should.be.exactly('number');
				yield fs.close.bind(fs, archiveDescriptor);
				done();
			});
		});
		it('should delete file if cannot download', function(done) {
			this.timeout(15000);
			var installer = new SimpleInstaller({installerInfo: {
				link: 'http://localhost/72e34fa881d6ffb9fb3ece2b89743b2c3df7f020.zip',
				name: 'shelljs.zip'
			}});
			co(function* () {
				yield installer.downloadProgram();
			}).catch(function (ex) {
				fs.exists(path.join(installer.tempFolder, installer.name), function (exists) {
					exists.should.be.exactly(false);
					done();
				});
			});
		});
		it('should delete file if status code is not 200', function(done) {
			this.timeout(15000);
			var installer = new SimpleInstaller({installerInfo: {
				link: 'http://www.google.com/not-found',
				name: 'shelljs.txt'
			}});
			co(function* () {
				yield installer.downloadProgram();
			}).catch(function (ex) {
				fs.exists(path.join(installer.tempFolder, installer.name), function (exists) {
					exists.should.be.exactly(false);
					done();
				});
			});
		});
		it('should go to catch statement if file cannot be deleted', function(done) {
			this.timeout(15000);
			var installer = new SimpleInstaller({
				installerInfo: {
					link: 'http://www.google.com/not-found',
					name: 'shelljs.txt'
				}
			});
			co(function* () {
				SimpleInstaller._simulateFsError = true;
				yield installer.downloadProgram();
			}).catch(function (ex) {
				co(function* () {
					var deleteFile = fs.unlink.bind(fs, ex.file.path);
					var closeFs = ex.file.close.bind(ex.file);
					yield [deleteFile, closeFs];
					SimpleInstaller._simulateFsError = false;
					fs.exists(ex.file.path, function (exists) {
						exists.should.be.exactly(false);
						done();
					});
				});
			});
		});
		it('should download file and run concatenate command using prefix name and postfix', function(done) {
			this.timeout(15000);
			cleanUp();
			var installer = new SimpleInstaller({
				installerInfo: {
					link: 'https://github.com/arturadib/shelljs/archive/72e34fa881d6ffb9fb3ece2b89743b2c3df7f020.zip',
			        prefix: 'echo ',
					name: 'shelljs.zip',
					postfix: ' is ready to be installed via postfix'
				}
			});
			co(function* () {
				yield installer.downloadAndInstall();
				var archiveDescriptor = yield fs.open.bind(fs, path.join(installer.tempFolder, installer.name), 'r');
				(typeof archiveDescriptor).should.be.exactly('number');
				yield fs.close.bind(fs, archiveDescriptor);
				done();
			});
		});
		it('should choose to install program', function(done) {
			this.timeout(15000);
			co(function* () {
				var info = {
					prefix: 'npm i co&&cd ' + SimpleInstaller.tempFolder + '&&node --harmony ../tests/',
					name: 'create-file.js'
				};
				var installer = new SimpleInstaller({installerInfo: info});
				yield installer.chooseInstallProcess();

				var archiveDescriptor = yield fs.open.bind(fs, path.join(installer.tempFolder, 'temp.txt'), 'r');
				(typeof archiveDescriptor).should.be.exactly('number');
				yield fs.close.bind(fs, archiveDescriptor);
				done();
			});
		});
		it('should choose to download file and install', function(done) {
			this.timeout(15000);
			var installer = new SimpleInstaller({
				installerInfo: {
					link: 'https://github.com/arturadib/shelljs/archive/72e34fa881d6ffb9fb3ece2b89743b2c3df7f020.zip',
					prefix: 'echo ',
					name: 'shelljs.zip',
					postfix: ' is ready to be installed via postfix'
				}
			});
			co(function* () {
				yield installer.chooseInstallProcess();
				var archiveDescriptor = yield fs.open.bind(fs, path.join(installer.tempFolder, installer.name), 'r');
				(typeof archiveDescriptor).should.be.exactly('number');
				yield fs.close.bind(fs, archiveDescriptor);
				done();
			});
		});
		it('should not install if program already exists', function(done) {
			this.timeout(15000);
			var installer = new SimpleInstaller({
				installerInfo: {
					link: 'https://localhost',
					name: 'node',
					update: function* () {
						var info = {
							prefix: 'npm i co&&cd ' + SimpleInstaller.tempFolder + '&&node --harmony ../tests/',
							name: 'create-file.js'
						};
						var installer = new SimpleInstaller({installerInfo: info});
						yield installer.chooseInstallProcess();
					}
				}
			});
			co(function* () {
				yield installer.run();
				var archiveDescriptor = yield fs.open.bind(fs, path.join(installer.tempFolder, 'temp.txt'), 'r');
				(typeof archiveDescriptor).should.be.exactly('number');
				yield fs.close.bind(fs, archiveDescriptor);
				done();
			});
		});
		it('should install if program does not exist in the path', function(done) {
			this.timeout(15000);
			var installer = new SimpleInstaller({
				installerInfo: {
					prefix: 'npm i co&&cd ' + SimpleInstaller.tempFolder + '&&node --harmony ../tests/',
					name: 'create-file.js'
				}
			});
			co(function* () {
				yield installer.run();
				var archiveDescriptor = yield fs.open.bind(fs, path.join(installer.tempFolder, 'temp.txt'), 'r');
				(typeof archiveDescriptor).should.be.exactly('number');
				yield fs.close.bind(fs, archiveDescriptor);
				done();
			});
		});
	});
});