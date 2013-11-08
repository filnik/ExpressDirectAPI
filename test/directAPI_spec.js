"use strict";

var dbUri = 'mongodb://localhost/baseapi-test-db';
var request = require('supertest'),
  utility = require('../lib/util.js'),
  BaseAPI = require('../lib/directAPI'),
  mongoose = require('mongoose'),
  clearDB = require('mocha-mongoose')(dbUri); //automatically clears the database at every run

describe("base_api", function () {
  var base;

  beforeEach(function (done) {

    if (mongoose.connection.db) return done();

    mongoose.connect(dbUri, function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("Connected to MongoDB successfully...");

      var Schema = mongoose.Schema,
        Model = new Schema({
          name        : {type: String, required: true},
          loc         : {lat: Number, lng: Number},
          timestamp   : {type: Date, default: new Date()},
          radius      : {type: Number}
        });

      Model.index({
        loc : "2d"
      });

      Model = mongoose.model('Model', Model);
      base = new BaseAPI(Model, "model");

      done();
    });
  });

  it("should connect to mongoDB and return an empty collection", function (done) {
    base.getFromModel({session: {}},
      {
        json: function (data) {
          expect(data).to.eql([]);
          done();
        }
      });
  });

  var createNewElement = function (callback, timestamp) {

    var res = createRes(function (data){
      expect(data['name']).to.eql('element1');
      callback(data);
    });

    base.newElementInModel(res,'element1',
      {
        name: 'element1',
        loc: {lat: 1, lng: 2},
        radius: 30,
        timestamp: timestamp
      });
  }

  it("should add (only) a new element correctly", function (done) {
    var timestamp = new Date(),
      res = createRes(function (data) {
        expect(data[0]['name']).to.eql('element1');
        expect(data[0]['loc']['lat']).to.eql(1);
        expect(data[0]['loc']['lng']).to.eql(2);
        expect(data[0]['radius']).to.eql(30);
        expect(data[0]['timestamp']).to.eql(timestamp);
        expect(data[1]).to.eql(undefined);
        done();
      });

    createNewElement(function(data){
      base.getFromModel({session: {}}, res);
    }, timestamp);
  });

  it("should update an element correctly", function (done) {
    var timestamp = new Date(),
      res = createRes(function (numRowAffected) {
        expect(numRowAffected).to.eql(1);
        var res = createRes(function(data) {
          expect(data[0]['name']).to.eql('changed');
        });
        base.getFromModel({session: {}}, res);
        done();
      });
    createNewElement(function(data){
      base.updateModelCustom(res, {
        name: "changed"
      }, data._id.toString());

    }, timestamp);
  });
});