"use strict";

global.sinon = require("sinon");
global.chai = require("chai");
global.expect = require("chai").expect;

global.chai.use(require("sinon-chai"));

global.createRes = function (callback) {return {status: function () {return this; }, json: callback };};