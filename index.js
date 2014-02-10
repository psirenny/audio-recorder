var chainsaw = require('chainsaw');

module.exports = function (obj) {
  if (!obj) obj = {};

  return chainsaw.light(function (saw) {
    var strategy = null;

    this.permission = function (callback) {
      strategy.permission.call(obj, function (val) {
        saw.next();
      });
    };

    this.start = function (callback) {
      strategy.start.call(obj, function () {
        saw.next();
      });
    };

    this.stop = function (callback) {
      strategy.stop.call(obj, function (url) {
        saw.nest(callback, url);
      });
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