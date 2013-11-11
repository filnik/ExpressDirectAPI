"use strict";

var util = require('./util.js');

/**
 *
 * @param Model the Mongoose model to interact with
 * @param APIName the string name of the model
 * @constructor
 */
function BaseAPI(Model, APIName) {
  this.Model = Model;
  this.APIName = APIName;
}

/**
 * check the status of the request and return the data, and error or an ok
 * @param err to return if present
 * @param res express' object to return the data checked
 * @param docs data returned by the processing to encapsulate and return
 * @returns {*}
 * @private
 */
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

/**
 * API access to get data from the model given
 * @param req
 * @param res
 * @param constraints eventual query that you can give to parse the data
 */
BaseAPI.prototype.getFromModel = function (req, res, constraints) {
  var limit = req.session.limit || 10,
    skip = req.session.skip || 0,
    that = this;

  this.Model.find(constraints, null, {skip: skip, limit: limit}, function (err, docs) {
    return that._checkStatus(err, res, docs);
  });
};

/**
 * the same as the previous one, but it's for authenticated sessions (with passport)
 * @param req
 * @param res
 * @param constraints
 * @returns {*}
 */
BaseAPI.prototype.authGetFromModel = function (req, res, constraints) {
  var user = req.user;
  constraints = constraints || {};
  constraints.toUsers = user._id.toString();
  return this.getFromModel(req, res, constraints);
};

/**
 * it creates the constraints for a near search
 * @param res
 * @param longitude
 * @param latitude
 * @param radius
 * @param constraints
 * @returns {*}
 */
BaseAPI.prototype.nearConstraints = function (res, longitude, latitude, radius, constraints) {
  radius = radius || 30;
  constraints = constraints || {};

  if (longitude === undefined || latitude === undefined) {
    return this.returnError(res, 'missing longitude or latitude');
  }

  constraints.loc = {$near: [longitude, latitude], $maxDistance: radius};

  return constraints;
};

/**
 * Direct api for removing an object from a collection
 * @param res
 * @param id
 */
BaseAPI.prototype.removeFromModel = function (res, id) {
  var that = this;
  this.Model.remove({_id: id}, function (err) {
    return that._checkStatus(err, res);
  });
};

/**
 * new element to add in the model
 * @param res
 * @param primaryKey element to check to know if the object that we are going to add has enough data or not
 * @param newElement
 */
BaseAPI.prototype.newElementInModel = function (res, primaryKey, newElement) {
  if (primaryKey === undefined || primaryKey === '') {
    return this.returnError(res, "missing " + this.APIName + "'s name");
  }

  var object = new this.Model(newElement),
    that = this;
  object.save(function (err, data) {
    return that._checkStatus(err, res, data);
  });
};

/**
 * update an old element of the database with the body given. It's custom since it doesn't
 * assume to use req.body element for the replace.
 * @param req
 * @param res
 * @param body
 * @param id
 * @returns {*}
 */
BaseAPI.prototype.updateModelCustom = function (res, body, id) {
  if (body === undefined) {
    return this.returnError(res, 'missing updated ' + this.APIName);
  }

  var that = this;
  this.Model.update({_id: id}, body, function (err, data) {
    if (res) {
      return that._checkStatus(err, res, data);
    }
  });
};

/**
 * as before but body = req.body
 * @param req
 * @param res
 * @param id
 */
BaseAPI.prototype.updateModel = function (req, res, id) {
  this.updateModelCustom(res, req.body, id);
};

/**
 * returns a (generic) error to the user
 * @param res
 * @param message
 * @param statusCode
 */
BaseAPI.prototype.returnError = function (res, message, statusCode) {
  statusCode = statusCode || 400;

  res.status(statusCode).json({error: message});
};

/**
 * returns ok to the user
 * @param res
 */
BaseAPI.prototype.returnOk = function (res) {
  res.json({ status: "ok" });
};

/**
 * returns the last entry inserted in the collection given
 * @param res
 */
BaseAPI.prototype.last = function (res) {
  var that = this;

  this.Model.find({}).sort({timestamp: -1}).limit(1).exec(function (err, data) {
    return that._checkStatus(err, res, data);
  });
};

module.exports = BaseAPI;