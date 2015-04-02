'use strict';

var co = require('co');
var fs = require('fs');
var path = require('path');
co(function* () {
	var file = fs.createWriteStream(path.join(process.cwd(), 'temp.txt'));
	yield file.close.bind(file);
	console.log('created');
});