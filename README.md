# Simple installer

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/szarouski/SimpleInstaller?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)  
Download and/or install programs in similar manner to chocolatey or similar installation managers.
- crossplatform (tested on windows and debian)
- downloads files (optional) and runs commands
- skips already installed programs
- could be used as a simple task runner
- could work as a downloader
- simple and because of that flexible and expendable api
- tested with 100% coverage
- uses harmony mode for generators and `npm co` to manage execution flow

License
- http://unlicense.org/

## Tests:

To launch tests you have to run `npm install` then `npm test` or if you prefer `grunt test`.

If you want to contribute make sure to run `grunt githooks` first thing after clone. 
It will create pre-commit hook and run tests and jshint before you commit. 
Please use git flow - create a feature branch for your feature and send a pull request to dev.

## API:

SimpleInstaller exports a constructor, which takes and object with following properties:
- `link :string` - (optional) url to installer/executable or any other resource
- `name :string` - used for progress reporting and for installation process, see `installProgram` for details
- `prefix :string` - (optional) used for installation process, prepends part of command to `name`, see `installProgram` for details
- `postfix :string` - (optional) used for installation process, appends part of command to `name`, see `installProgram` for details
- `update :generator function` - (optional) if program is already installed it runs user code for an update
- `tempFolder :string` - (optional) overwrites `SimpleInstaller.tempFolder`
- `installMessage :string` - (optional) used for progress reporting, overwrites default string `'installing ' + info.name`

Constructor has following static properties:
- `tempFolder :string` - defaults to "temp", all downloads will be placed here

Constructor has following prototype methods:
- `run :generator function` - first it runs `isInstalled`, if result is successful it runs `chooseInstallProcess`, otherwise it runs `runUpdateIfExists`
- `isInstalled :function` - uses crossplatform version of `which` verifying that `info.name` exists in your path
- `runUpdateIfExists :generator function` - if `info.update` exists, it will run it. `this` is referring to `info` object
- `chooseInstallProcess :generator function` - if `info.link` wasn't specified it runs `installProgram`, else it runs `downloadAndInstall`
- `downloadAndInstall :generator function` - downloads `info.link` and runs `installProgram`
- `installProgram :function` - concatenates `info.prefix`, `info.name` and `info.postfix` and runs results as a command line

## Examples:

```js
//following will install git on windows using git.inf if git.exe doesn't exist in your path
var co = require('co');
var SimpleInstaller = require('simple-installer');

co(function* () {
    yield new SimpleInstaller({
        link: 'http://github.com/msysgit/msysgit/releases/download/' +
        'Git-1.9.4-preview20140929/Git-1.9.4-preview20140929.exe',
        name: 'git.exe',
        postfix: ' /DIR="c:\\Git" /VERYSILENT /NORESTART /NOCANCEL /SP- /CLOSEAPPLICATIONS /RESTARTAPPLICATIONS /NOICONS ' +
        '/COMPONENTS="icons,ext\\reg\\shellhere,assoc,assoc_sh" /LOADINF="git.inf"'
    }).run();
});

//same example for debian
var co = require('co');
var SimpleInstaller = require('simple-installer');

co(function* () {
    yield new SimpleInstaller({
        prefix: 'apt-get install ',
        name: 'git'
    }).run();
});
```
For advanced usage (batch install, update, ...) check `example` folder.

[![Analytics](https://ga-beacon.appspot.com/UA-61501696-1/szarouski/SimpleInstaller/README)](https://github.com/igrigorik/ga-beacon)