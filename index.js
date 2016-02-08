var through = require("through2");
var gutil = require("gulp-util");
var PluginError = gutil.PluginError;
var PLUGIN_NAME = 'gulp-jsclosure';

module.exports = function (options) {
  var newline = gutil.linefeed;
  var params = {};

  if (Array.isArray(options)) {
    options.forEach(function (p) {
      params[p] = p;        
    });
  } else if (typeof options === "object") {
    for (var i in options) {
      if (options.hasOwnProperty(i)) {
        params[i] = options[i];
      }
    }
  } 
  /**
   * This function will take an array of params to be passed into the closure
   * it will build the javascript closure around the file and it will pass the file
   * down the chain.
   * 
   * @param  {Object} params [An paramValue:paramName-object]
   * @return {Function} []
   */
   var buildClosure = function(params) {
    /**
     * This function is returned by buildClosure and is the meat of the entire application
     * It will verify that the file being passed into the function is A) not null and B) 
     * not a stream. It will then build around the contents a standard javascript closure
     * with the parameters provided by buildClosure (if any).
     * @param  {Object}   file     [This is the file that we will be building our closure around]
     * @param  {String}   encoding [Encoding type of the file param]
     * @param  {Function} callback [This function invokes the callback in order to continue the stream flow]
     * @return {Function} [Return the value of callback()]
     */
     return function(file, encoding, callback) {
      if (file.isNull()) {
        this.push(file);
        return callback();        
      }

      if (file.isStream()) {
        this.emit('error', new PluginError(PLUGIN_NAME, 'gulp-jsclosure: Streaming not supported'));
        return callback();
      }

      if (file.isBuffer()) {
        var paramNames = [];
        var paramValues = [];
        for (var p in params) {
          if (params.hasOwnProperty(p)) {
            paramValues.push(p);
            paramNames.push(params[p])
          }
        }

        file.contents = Buffer.concat([
          new Buffer(";(function(" + paramNames.join(", ") + ") {" + newline),
          file.contents,
          new Buffer(newline + "})(" + paramValues.join(", ") + ");")
          ]);
      }

      this.push(file);
      return callback();
    };
  };

  return through.obj(buildClosure(params));
};
