var events = require('events');
var util = require('util');

function Recorder(options) {
  this.timer = {};
}

util.inherits(Recorder, events.EventEmitter);

Recorder.prototype._tick = function () {
  this.timer.currentTime = new Date().getTime();
  this.timer.duration = this.timer.currentTime - this.timer.startTime;
  this.emit('tick', this.timer.duration);
  if (this.timer.duration > this.timer.maxDuration) this.stop();
};

Recorder.prototype.destroy = function () {
  this.strategy = null;
  clearInterval(this.timer.id);
  this.timer = {};
  this.emit('destroy');
};

Recorder.prototype.permission = function (callback) {
  var self = this;
  if (!callback) callback = function () {};
  this.emit('permission');
  this.strategy.permission.call(this, function (err, val) {
    if (err) return callback(err);
    callback(null, val);
    self.emit('permitted', val);
  });
  return this;
};

Recorder.prototype.start = function (opts, callback) {
  var self = this;
  if (!opts) opts = {};
  if (!callback) callback = function () {};
  if (typeof opts === 'function') callback = opts;
  if (!opts.maxDuration) opts.maxDuration = Infinity;
  if (!opts.period) opts.period = 100;
  self.emit('start');
  this.strategy.start.call(this, function (err) {
    if (err) return callback(err);
    self.timer.maxDuration = opts.maxDuration;
    self.timer.startTime = new Date().getTime();
    self.timer.id = setInterval(self._tick.bind(self), opts.period);
    self.emit('started');
  });
  return this;
};

Recorder.prototype.stop = function (callback) {
  var self = this;
  if (!callback) callback = function () {};
  clearInterval(self.timer.id);
  self.timer = {};
  self.emit('stop');
  this.strategy.stop.call(this, function (err, uri) {
    if (err) return callback(err);
    callback(null, uri);
    self.emit('stopped', uri);
  });
  return this;
};

Recorder.prototype.use = function (strategy, callback) {
  var self = this;
  if (this.strategy) return this;
  if (!callback) callback = function () {};
  strategy.available(function (err, val) {
    if (err) return self;
    if (!val) return self;
    self.strategy = strategy;
    self.strategy.create.call(self, callback);
  });
  return this;
};

module.exports = function () {
  return new Recorder();
};
