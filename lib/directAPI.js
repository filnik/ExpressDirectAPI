"use strict";

var util = require('./util.js');

function BaseAPI(Model, APIName) {
  this.Model = Model;
  this.APIName = APIName;
}

BaseAPI.prototype._checkStatus = function (err, res, docs) {
  if (err) {
    util.log(err);
    return this.returnError(res, err.toString());
  }
  if (docs) {
    return res.json(docs);
  }
  return this.returnOk(res);
};

BaseAPI.prototype.getFromModel = function (req, res, constraints) {
  var limit = req.session.limit || 10,
    skip = req.session.skip || 0,
    that = this;

  this.Model.find(constraints, null, {skip: skip, limit: limit}, function (err, docs) {
    return that._checkStatus(err, res, docs);
  });
};

BaseAPI.prototype.authGetFromModel = function (req, res, constraints) {
  var user = req.user;
  constraints = constraints || {};
  constraints.toUsers = user._id.toString();
  return this.getFromModel(req, res, constraints);
};

BaseAPI.prototype.nearConstraints = function (res, longitude, latitude, radius, constraints) {
  radius = radius || 30;
  constraints = constraints || {};

  if (longitude === undefined || latitude === undefined) {
    return this.returnError(res, 'missing longitude or latitude');
  }

  constraints.loc = {$near: [longitude, latitude], $maxDistance: radius};

  return constraints;
};

BaseAPI.prototype.removeFromModel = function (res, id) {
  var that = this;
  this.Model.remove({_id: id}, function (err) {
    return that._checkStatus(err, res);
  });
};

BaseAPI.prototype.newElementInModel = function (res, primaryKey, newElement) {
  if (primaryKey === undefined || primaryKey === '') {
    this.returnError("missing " + this.APIName + "'s name");
  }

  var object = new this.Model(newElement),
    that = this;
  object.save(function (err) {
    return that._checkStatus(err, res);
  });
};

BaseAPI.prototype.updateModelCustom = function (req, res, body, id) {
  if (req.body === undefined) {
    return this.returnError('missing updated ' + this.APIName);
  }

  var that = this;
  this.Model.update({_id: id}, req.body, function (err, data) {
    if (res) {
      return that._checkStatus(err, res, data);
    }
  });
};

BaseAPI.prototype.updateModel = function (req, res, id) {
  this.updateModelCustom(req, res, req.body, id);
};

BaseAPI.prototype.returnError = function (res, message, statusCode) {
  statusCode = statusCode || 400;

  res.status(statusCode).json({error: message});
};

BaseAPI.prototype.returnOk = function (res) {
  res.json({ status: "ok" });
};

BaseAPI.prototype.last = function (res) {
  var that = this;

  this.Model.find({}).sort({timestamp: -1}).limit(1).exec(function (err, data) {
    return that._checkStatus(err, res, data);
  });
};

module.exports = BaseAPI;