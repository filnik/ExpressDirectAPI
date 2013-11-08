"use strict";

var request = require('supertest'),
  utility = require('../lib/util.js'),
  BaseAPI = require('../lib/directAPI'),
  mongoose = require('mongoose'),
  mongooseMocha = require('mocha-mongoose');

describe("base_api", function () {
  var base;

  beforeEach(function (done) {

    var dbUri = 'mongodb://localhost/baseapi-test-db';

    mongoose.connect(dbUri, function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("Connected to MongoDB successfully...");
      mongooseMocha(dbUri);

      var Schema = mongoose.Schema,
        Model = new Schema({
          name        : {type: String, required: true},
          surname     : {type: String},
          username    : {type: String, required: true, unique: true},
          type        : {type: String, enum: ['normal', 'operator', 'administrator']},
          teamId      : {type: Schema.Types.ObjectId, required: true, unique: false, default: null},
          experience  : {type: String, enum: ['low', 'medium', 'high']},
          skills      : {type: Array }
        });

      Model = mongoose.model('Model', Model);
      base = new BaseAPI(Model, "model");

      done();
    });
  });

  it("should connect to mongoDB and return an empty collection", function (done) {
    base.getFromModel({session: {}}, {json:
      function (data) {
        expect(data).to.eql([]);
        done();
      }});
  });
});