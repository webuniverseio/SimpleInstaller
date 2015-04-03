'use strict';
/**
 * @type {SimpleInstaller|function}
 */
var SimpleInstaller = require('simple-installer');
var shell = require('shelljs');
var ShellErrorHandler = require('simple-installer/src/ShellErrorHandler');
var shellHandler = new ShellErrorHandler(shell);
var _ = require('lodash');
var path = require('path');

//noinspection SpellCheckingInspection
module.exports = [{
	link: 'https://dl.bintray.com/oneclick/rubyinstaller/rubyinstaller-2.2.1-x64.exe?direct',
	name: 'ruby',
	postfix: ' /verysilent /dir="c:\\Ruby2" /tasks="assocfiles,modpath"',
	update: function* () {
		var version = shell.exec('ruby -v').output.replace(/.+(\d+\.\d+\.\d+).+/, '$1');
		version = Number(version.replace(/^(\d+)\./, '$1'));
		var targetVersion = Number(
			shell.exec('c:\\ruby2\\bin\\ruby.exe -v').output
				.replace(/.+(\d+\.\d+\.\d+).+/, '$1')
				.replace(/^(\d+)\./, '$1')
		);
		var isPathCached = targetVersion === 22.1;
		if (!isPathCached && version < 22.1) {
			shell.exec('gem uninstall sass -x -a');
			shellHandler.throwIfHasErrors(
				'can\'t uninstall sass for ruby update, ' +
				'please run "gem uninstall sass --force" and try running "npm install" again'
			);

			var info = _.omit(this, 'update');
			info.name += '.v2.2.1';
			yield new SimpleInstaller(info).run();
			shell.exec('gem install sass');
			shellHandler.throwIfHasErrors(
				'can\'t install sass for ruby update, ' +
				'please run "gem install sass" and try running "npm install" again'
			);
		}
	}
}, {
	condition: function () {
		var version = Number(shell.exec('gem -v').output.trim().replace(/^(\d+)\./, '$1'));
		return version < 22.3;
	},
	link: 'https://github.com/rubygems/rubygems/releases/download/v2.2.3/rubygems-update-2.2.3.gem',
	prefix: 'gem install --local ',
	name: 'rubygems-update-2.2.3.gem',
	postfix: '&&update_rubygems --no-ri --no-rdoc&&gem uninstall rubygems-update -x'
}, {
	link: 'http://github.com/msysgit/msysgit/releases/download/' +
	'Git-1.9.4-preview20140929/Git-1.9.4-preview20140929.exe',
	name: 'git.exe',
	postfix: ' /DIR="c:\\Git" /VERYSILENT /NORESTART /NOCANCEL /SP- /CLOSEAPPLICATIONS /RESTARTAPPLICATIONS /NOICONS ' +
	'/COMPONENTS="icons,ext\\reg\\shellhere,assoc,assoc_sh" /LOADINF="' + path.resolve(__dirname, 'git.inf') + '"'
}, {
	prefix: 'npm i ',
	name: 'karma',
	postfix: '-cli -g'
}, {
	prefix: 'npm i ',
	name: 'grunt',
	postfix: '-cli -g'
}, {
	prefix: 'npm i ',
	name: 'bower',
	postfix: ' -g'
}, {
	prefix: 'SET PATH=%PATH%;c:\\Ruby2\\bin&&gem install ',
	name: 'sass'
}];