"use strict";

var log = function (text) {
  // workaround to the get the code line
  function getErrorObject() {
    try { throw new Error(''); } catch (err) { return err; }
  }

  var err = getErrorObject(),
    callerLine = err.stack.split("\n")[4],
    index = callerLine.indexOf("at "),
    clean = callerLine.slice(index + 2, callerLine.length);
  console.log(clean + " " + text);
};

exports.log = log;