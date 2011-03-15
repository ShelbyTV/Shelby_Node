var https = require('https'),
    sys = require('sys'),
    events = require('events'),
    URL = require('url'),
    qs = require('./querystring'),
    crypto = require('crypto');

var hmac_md5 = crypto.createHmac('md5');

function md5(str) {
  hmac_md5.init('md5');
  hmac_md5.update(str);
  return hmac_md5.digest('hex');
}

function badRequest(code, res) {
  res.writeHead(code);
  res.end('Bad Request: ' + code);
}



/**
 * Creates a new Facebook Realtime Graph Client
 *
 * @constructor
 * @param {Object}  options        A hash of options.
 * @extends {events.EventEmitter}
**/
function RealtimeGraph(options) {
  events.EventEmitter.call(this);

  this.app_id = options.app_id;
  this.app_secret = options.app_secret;
  this.domain = options.domain;
  this.path = options.path || '/';

  this._tokens = [];
  this.callback_url = 'http://' + this.domain + this.path;
}

sys.inherits(RealtimeGraph, events.EventEmitter);


/**
 * Publicly export RealtimeGraph.
**/
exports.Client = RealtimeGraph;
exports.createClient = function(options) {
  return new RealtimeGraph(options);
};


/**
 * Subscribes the current instance to an object and specified fields.
 * As per facebook documentation, you can only ever have one subscriber
 * per object, and if you try subscribing to an object multiple times,
 * the original subscription will just be modified.
 *
 * @param {String}    object  The Facebook Object to subscribe to,
 *                            currently only able to be one of: user,
 *                            permissions, page.
 * @param {(String|Array.<String>)}  fields  The Facebook Object's fields to
 *                            subscribe to.
**/
RealtimeGraph.prototype.subscribe = function(object, fields) {
  var params = {
    object: object,
    fields: Array.isArray(fields) ? fields.sort().join(',') : fields,
    verify_token: md5([(new Date).getTime(), object].concat(fields).join(',')),
    callback_url: this.callback_url
  };

  this._tokens.push(params.verify_token);

  this._outgoingRequest({
    method: 'POST',
    params: params
  });
};


/**
 * Unsubscribes the application from receiving updates from facebook.
 *
 * @param {String}    object    The facebook object to unsubscribe from.
 * @param {Function}  callback  Function to call on completion of the
 *                              HTTP Request.
**/
RealtimeGraph.prototype.unsubscribe = function(object, callback) {
  var params = {};

  if (!callback && typeof object == 'function') {
    callback = object;
  } else {
    params.object = object;
  }

  this._outgoingRequest({
    method: 'DELETE',
    params: params,
    success: callback
  });
};


/**
 * Makes a HTTP Request to Facebook to get a list of the current subscriptions
 * the application has with the Realtime Graph API. Calls the callback with that
 * value.
 *
 * @param {Function} callback   The Callback function to trigger on success.
**/
RealtimeGraph.prototype.list = function(callback) {
  this._outgoingRequest({
    method: 'GET',
    success: callback
  });
};


/**
 * Triggers a callback after a access_token has been acquired.
 * <p>
 * If: there is an access_token already, it calls the callback and returns.
 * Else: it makes a HTTP Request to Facebook to acquire a token, and then
 * calls the callback.
 *
 * @param {Function} callback   Function to call on successful acquistion
 *                              of an access_token.
**/
RealtimeGraph.prototype.getAccessToken = function(callback) {
  if (this.access_token) {
    callback();
  } else {

    var self = this;

    https.request({
      method: 'POST',
      host:   'graph.facebook.com',
      port:   443,
      path:   '/oauth/access_token?' +
              'grant_type=client_credentials&' +
              'client_id=' + this.app_id + '&' +
              'client_secret=' + this.app_secret

    }, function (response) {
      response.setEncoding('utf8');
      var body = '';
      response.on('data', function (data) {
        body += data;
      });
      response.on('end', function () {
        if (response.statusCode == 200) {
          self.access_token = qs.parse(body).access_token;
          callback();
        } else {
          var error = JSON.parse(body).error;
          var e = new Error(error.message);

          e.name = error.type;

          self.emit('error', e);
        }
      });
    }).on('error', function (error) {
      self.emit(error);
    }).end();
  }
};


/**
 * Send a new HTTP Request to Facebook.com
 *
 * @param {Object} options  An object of options for the request.
**/
RealtimeGraph.prototype._outgoingRequest = function(options) {
  var self = this;

  if (!this.access_token) {
    this.getAccessToken(function() {
      self._outgoingRequest(options);
    });
  } else {
    var params = options.params || {};
    params.access_token = this.access_token;

    var request_options = {
      method: options.method,
      host:   'graph.facebook.com',
      port:   443,
      path:   '/' + this.app_id + '/subscriptions?' +
              qs.stringify(params),
      header: options.header || {}
    };

    if (options.body) {
      request_options.header['Content-Length'] =
          Buffer.byteLength(options.body);
    }

    var request = https.request(request_options, function (response) {
      response.setEncoding('utf8');
      var body = '';
      response.on('data', function (data) {
        body += data;
      });
      response.on('end', function () {
        if (response.statusCode == 200) {
          if (typeof options.success == 'function') {
            options.success(response, body ? JSON.parse(body) : null);
          }
        } else {
          body = JSON.parse(body);

          if (body && body.error) {
            var e = new Error(body.error.message);
            e.name = body.error.type;
          } else {
            var e = new Error();
          }

          if (typeof options.error == 'function') {
            options.error(e);
          } else {
            self.emit('error', e);
          }
        }
      });
    });

    request.on('error', function (error) {
      if (typeof options.error == 'function') {
        options.error(error);
      } else {
        self.emit('error', error);
      }
    });

    if (options.body) {
      request.write(options.body);
    }
    request.end();
  }
};


/**
 * Takes a given request, handles it if applicable and returns a boolean
 * as to whether the request was handled.
 *
 * @param   {http.Request}  req   Incoming HTTP Request.
 * @param   {http.Response} res   Outgoing HTTP Response.
 * @return  {boolean}             If the request was handled.
**/
RealtimeGraph.prototype.handleRequest = function(req, res) {
  var self = this;
  req.setEncoding('utf8');

  var url = URL.parse(req.url);
  if (url.pathname === this.path) {
    switch (req.method.toUpperCase()) {
      // This is a verification request
      case 'GET':
        var q = qs.parse(url.query);
        if (q['hub.verify_token'] && q['hub.mode'] === 'subscribe') {
          var token = this._tokens.indexOf(q['hub.verify_token']);

          if (token > -1) {
            this._tokens.splice(token, 1);
            res.writeHead(200);
            res.end(q['hub.challenge']);
          } else {
            badRequest(400, res);
          }
        } else {
          badRequest(400, res);
        }
        break;

      // Facebook sending us update data:
      case 'POST':
        var buffer = '';
        req.on('data', function(data) {
          buffer += data;
        }).on('end', function() {
          res.writeHead(200);
          res.end();

          var updates = JSON.parse('[' + buffer + ']');

          updates.forEach(function(update) {
            update.entry.forEach(function(entry) {
              self.emit('change', update.object, entry);
              self.emit('change.' + update.object, entry);
            });
          });
        });
        break;

      // Any other requests aren't permitted.
      default:
        badRequest(501, res);
        break;
    }
    return true;
  } else {
    return false;
  }
};
