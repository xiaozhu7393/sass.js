/*! sass.js - v0.10.1 (8467e47) - built 2016-12-19
  providing libsass 3.4.1 (b9b5756)
  via emscripten 1.36.0 ()
 */
var fs = require('fs');
var Sass = require('./sass.sync.js');

function fileExists(path) {
  var stat = fs.statSync(path);
  return stat && stat.isFile();
}

function importFileToSass(path, done) {
  // any path must be relative to CWD to work in both environments (real FS, and emscripten FS)
  var requestedPath = './' + path;
  // figure out the *actual* path of the file
  var filesystemPath = Sass.findPathVariation(fileExists, requestedPath);
  if (!filesystemPath) {
    done({
      error: 'File "' + requestedPath + '" not found',
    });

    return;
  }

  // write the file to emscripten FS so libsass internal FS handling
  // can engage the scss/sass switch, which apparently does not happen
  // for content provided through the importer callback directly
  var content = fs.readFileSync(filesystemPath, {encoding: 'utf8'});
  Sass.writeFile(filesystemPath, content, function() {
    done({
      path: filesystemPath,
    });
  });
}

function importerCallback(request, done) {
  // sass.js works in the "/sass/" directory, make that relative to CWD
  var requestedPath = request.resolved.replace(/^\/sass\//, '' );
  importFileToSass(requestedPath, done);
}

function compileFile(path, options, callback) {
  if (!callback) {
    callback = options;
    options = {};
  }

  Sass.importer(importerCallback);
  importFileToSass(path, function() {
    Sass.compileFile(path, options, callback);
  });
}

compileFile.importFileToSass = importFileToSass;
compileFile.Sass = Sass;

module.exports = compileFile;
