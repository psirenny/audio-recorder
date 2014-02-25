var chainit = require('chainit')
  , events = require('events');

function Recorder() {
  this.data = {};
  this.events = new events.EventEmitter();
  this.isRecording = false;
  this.strategy = null;
}

Recorder.prototype.limit = function (time, next) {
  var self = this;
  var stop = function () { self.stop(); };
  setTimeout(stop, time);
  next();
};

Recorder.prototype.on = function (event, callback) {
  this.events.on(event, callback);
  return this;
};

Recorder.prototype.permission = function (next) {
  this.strategy.permission.call(this.data, function () {
    next();
  });
};

Recorder.prototype.send = function (url, next) {
  var self = this;

  function fn () {
    self.strategy.send.call(self.data, url,
      function (err, url) {
        next(err, url);
      }
    );
  };

  if (this.isRecording) return this.on('stop', fn);
  fn();
};

Recorder.prototype.start = function (next) {
  var self = this;
  this.strategy.start.call(this.data, function () {
    self.isRecording = true;
    self.events.emit('start');
    next();
  });
};

Recorder.prototype.started = function (callback, next) {
  this.on('start', next);
};

Recorder.prototype.stop = function (next) {
  var self = this;
  if (this.timerId) clearInterval(this.timerId);
  this.strategy.stop.call(this.data, function () {
    self.isRecording = false;
    self.events.emit('stop');
    next();
  });
};

Recorder.prototype.stopped = function (next) {
  this.on('stop', next);
};

Recorder.prototype.timer = function (next) {
  var startTime = (new Date()).getTime();
  this.timerId = setInterval(function () {
    var currentTime = (new Date()).getTime();
    var elapsedTime = currentTime - startTime;
    next(elapsedTime);
  }, 50);
};

Recorder.prototype.use = function (strat, next) {
  var self = this;
  if (this.strategy) return next();
  strat.available.call(this.data, function (val) {
    if (val) self.strategy = strat;
    next();
  });
};

module.exports = chainit(Recorder);