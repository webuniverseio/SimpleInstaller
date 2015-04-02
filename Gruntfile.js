/*global module:false*/
//noinspection GjsLint
module.exports = function initGrunt(grunt) {
	'use strict';

	// Project configuration.
	grunt.initConfig({
		// Metadata.
		pkg: grunt.file.readJSON('package.json'),
		jshint: {
			options: {
				jshintrc: true
			},
			gruntfile: {
				src: 'Gruntfile.js'
			},
			'lib_test': {
				src: ['src/**/*.js', 'tests/**/*.js']
			}
		},
		githooks: {
			all: {
				// Will run the jshint and test:unit tasks at every commit
				'pre-commit': 'jshint test'
			}
		}
	});

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-githooks');

	// Default task.
	grunt.registerTask('default', ['jshint']);

	grunt.registerTask('test', function () {
		var shell = require('shelljs');
		var ShellErrorHandler = require('./src/ShellErrorHandler');
		var shellHandler = new ShellErrorHandler(shell);
		shell.exec('npm test');
		shellHandler.throwIfHasErrors('test contains errors');
	});
};
