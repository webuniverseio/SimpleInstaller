//jshint node: true
'use strict';

function ShellErrorHandler(shell) {
    this.shell = shell;
}

/**
 * @param {String} error
 */
ShellErrorHandler.prototype.throwIfHasErrors = function throwIfHasErrors(error) {
    var errorMsg = this.shell.error();
    /* istanbul ignore if  */
    if (errorMsg) {
        //noinspection ExceptionCaughtLocallyJS
        throw new Error(error + ' | details from shell: ' + errorMsg);
    }
};

module.exports = ShellErrorHandler;