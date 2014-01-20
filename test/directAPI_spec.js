"use strict";

var dbUri = 'mongodb://localhost/baseapi-test-db';
var utility = require('../lib/util.js'),
  DirectAPI = require('../lib/directAPI'),
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
          radius      : {type: Number},
          toUsers     : {type: Array, default: []}
        });

      Model.index({
        loc : "2d"
      });

      Model = mongoose.model('Model', Model);
      base = new DirectAPI(Model, "model");

      // drop all the indexes created by other tests
      Model.collection.dropAllIndexes(function (err, results) {
        if (err) {
          console.log(err);
        }
      });

      done();
    });
  });

  var createNewElement = function (callback, timestamp, elementName, toUsers) {
    elementName = elementName || 'element1';
    toUsers = toUsers || [];
    var res = createRes(function (data) {
      expect(data['name']).to.eql(elementName);
      callback(data);
    });

    base.newElementInModel(res, elementName,
      {
        name: elementName,
        loc: {lat: 1, lng: 2},
        radius: 30,
        timestamp: timestamp,
        toUsers : toUsers
      });
  }

  it("should connect to mongoDB and return an empty collection", function (done) {
    base.getFromModel({session: {}}, createRes(
      function (data) {
          expect(data).to.eql([]);
          done();
      }));
  });

  it("should get items filtered by user ", function (done) {
    createNewElement(function(data){
      createNewElement(function(data){
        createNewElement(function(data){
          base.authGetFromModel({session: {}, user: {_id: 'id1'}}, createRes(
            function (data) {
              expect(data[0]['name']).to.eql('element1');
              expect(data[1]['name']).to.eql('element3');
              expect(data[2]).to.eql(undefined);
              done();
            }));
        }, new Date(), 'element3', ['id1']);
      }, new Date(), 'element2', ['id2', 'id3']);
    }, new Date(), 'element1', ['id1', 'id2']);
  });

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

  it("should not add a new element correctly", function (done) {
    var timestamp = new Date(),
      res = createRes(function (data) {
        expect(data.error).to.eql("missing model's name");
        done();
      });

    base.newElementInModel(res, undefined,
      {
        loc: {lat: 1, lng: 2},
        radius: 30,
        timestamp: timestamp
      });
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
      // use updateModel instead of updateModelCustom to cover more lines in the test
      base.updateModel(
        { body: {
            name: "changed"
          }
        }, res, data._id.toString());

    }, timestamp);
  });

  it("should update an element correctly with query", function (done) {
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
      // use updateModel instead of updateModelCustom to cover more lines in the test
      base.updateModelCustomQuery(res,
        { name: "changed" }, {_id: data._id.toString()});
    }, timestamp);
  });

  it("should not update an element correctly", function (done) {
    var res = createRes(function (data) {
        expect(data.error).to.eql('missing updated model');
        done();
      });
      base.updateModel({ body: undefined }, res, 'id');
  });


  it("should handle correctly an error with checkstatus", function (done) {
    base._checkStatus('commonErr', createRes(function (data){
      expect(data.error).to.eql('commonErr');
      done();
    }));
  });

  it("should get the last element inserted", function (done) {
    var timestamp = new Date();

    process.nextTick(function () {
      var timestamp2 = new Date(),
      res = createRes(function (data) {
        done();
      });
      createNewElement(function(data){
        createNewElement(function (data){
          base.last(res);
        }, timestamp2, 'element2');
      }, timestamp, 'element1');
    });
  });

  it("should remove an element correctly", function (done) {
    var timestamp = new Date(),
      res = createRes(function () {
        var res = createRes(function(data) {
          expect(data).to.eql([]);
        });
        base.getFromModel({session: {}}, res);
        done();
      });
    createNewElement(function(data){
      base.removeFromModel(res, data._id.toString());

    }, timestamp);
  });

  it("should return an error if newConstraints is called without longitude or latitude", function (done) {
    base.nearConstraints(createRes(function (error) {
      expect(error.error).to.eql('missing longitude or latitude');
      done();
    }));
  });

  it("should return correctly the contrains with nearConstrains", function (done) {
    var constraints = base.nearConstraints({}, 1, 2);
    expect(constraints.loc.$near[0]).to.eql(1);
    expect(constraints.loc.$near[1]).to.eql(2);
    expect(constraints.loc.$maxDistance).to.eql(30);
    done();
  });

});