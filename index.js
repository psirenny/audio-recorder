var chainsaw = require('chainsaw');

module.exports = function (obj) {
  if (!obj) obj = {};

  return chainsaw.light(function (saw) {
    var strategy = null;

    this.available = function (callback) {
      saw.nest(callback, !!strategy);
    };

    this.isRecording = function (callback) {
      saw.nest(callback, !!obj.isRecording);
    };

    this.limit = function (time, callback) {
      var self = this;
      var stop = function () { self.stop(); };
      obj.timer = setTimeout(stop, time);
      if (callback) return saw.nest(callback);
      saw.next();
    };

    this.permission = function (callback) {
      strategy.permission.call(obj, function () {
        if (callback) return saw.nest(callback);
        saw.next();
      });
    };

    this.send = function (url, callback) {
      strategy.send.call(obj, url, function (err, url) {
        if (callback) return saw.nest(callback, err, url);
        saw.next();
      });
    };

    this.start = function (callback) {
      strategy.start.call(obj, function () {
        obj.isRecording = true;
        if (callback) return saw.nest(callback);
        saw.next();
      });
    };

    this.stop = function (callback) {
      if (obj.timer) clearInterval(obj.timer);
      strategy.stop.call(obj, function () {
        obj.isRecording = false;
        if (callback) return saw.nest(callback);
        saw.next();
      });
    };

    this.toggle = function (callback) {
      if (obj.isRecording) return this.stop(callback);
      this.start(callback);
    };

    this.use = function (strat) {
      if (strategy) return saw.next();
      strat.available.call(obj, function (val) {
        if (val) strategy = strat;
        saw.next();
      });
    };
  });
};