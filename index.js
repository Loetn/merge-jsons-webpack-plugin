"use strict";
var es6_promise_1 = require("es6-promise");
var path = require("path");
var Glob = require("glob");
var fs = require("fs");
var _root = path.resolve(__dirname, "./");
var UTF8_ENCODING = "utf8";
var MergeJsonWebpackPlugin = (function () {
    function MergeJsonWebpackPlugin(options) {
        var _this = this;
        this.apply = function (compiler) {
            compiler.plugin("this-compilation", function (compilation) {
                console.log("MergeJsonWebpackPlugin compiling....");
                _this.init();
            });
        };
        this.load = function (files) {
            return new es6_promise_1.Promise(function (resolve, reject) {
                var mergedJsons = [];
                for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
                    var f = files_1[_i];
                    f = f.trim();
                    if (!f.endsWith(".json") && !f.endsWith(".JSON")) {
                        throw new Error("Not a valid json file " + f);
                    }
                    var entryData = undefined;
                    try {
                        var encoding = _this.options.encoding;
                        if (!encoding) {
                            encoding = UTF8_ENCODING;
                        }
                        console.log('encodin ', encoding);
                        entryData = fs.readFileSync(f, encoding);
                    }
                    catch (e) {
                        console.error("File missing [", f, "]  error ", e);
                        throw e;
                    }
                    if (!entryData) {
                        throw new Error("Data appears to be empty in file [" + f + " ]");
                    }
                    var entryDataAsJSON = {};
                    try {
                        entryDataAsJSON = JSON.parse(entryData);
                    }
                    catch (e) {
                        console.error("Error parsing the json file [ ", f, " ] and error is ", e);
                        throw e;
                    }
                    if (typeof entryDataAsJSON !== 'object') {
                        throw new Error("Not a valid object , file  [ " + f + " ]");
                    }
                    mergedJsons.push(entryDataAsJSON);
                }
                var mergedContents = {};
                for (var _a = 0, mergedJsons_1 = mergedJsons; _a < mergedJsons_1.length; _a++) {
                    var entryData = mergedJsons_1[_a];
                    mergedContents = _this.mergeDeep(mergedContents, entryData);
                }
                var retVal = JSON.stringify(mergedContents);
                resolve(retVal);
            });
        };
        this.mergeDeep = function (target, source) {
            if (typeof target == "object" && typeof source == "object") {
                for (var key in source) {
                    if (source[key] === null && (target[key] === undefined || target[key] === null)) {
                        target[key] = null;
                    }
                    else if (source[key] instanceof Array) {
                        if (!target[key])
                            target[key] = [];
                        target[key] = target[key].concat(source[key]);
                    }
                    else if (typeof source[key] == "object") {
                        if (!target[key])
                            target[key] = {};
                        _this.mergeDeep(target[key], source[key]);
                    }
                    else {
                        target[key] = source[key];
                    }
                }
            }
            return target;
        };
        this.write = function (_path, data) {
            try {
                _this.ensureDirExists(_path)
                    .then(function () {
                    fs.writeFileSync(_path, data, 'utf8');
                });
            }
            catch (e) {
                console.error("Unable to write output data to the file system ", e);
                throw e;
            }
        };
        this._glob = function (pattern) {
            return new es6_promise_1.Promise(function (resolve, reject) {
                new Glob(pattern, { mark: true }, function (err, matches) {
                    if (err) {
                        throw err;
                    }
                    resolve(matches);
                });
            });
        };
        this.init = function () {
            var files = _this.options.files;
            var output = _this.options.output;
            var groupBy = output.groupBy;
            if (files && groupBy) {
                throw new Error('Specify either files (all the files to merge with filename) or groupBy to specifiy a pattern(s)' +
                    'of file(s) to merge. ');
            }
            if (files) {
                _this.processFiles(files, output.fileName);
            }
            else if (groupBy) {
                _this.processGlob(groupBy);
            }
        };
        this.processFiles = function (files, filename) {
            _this.load(files)
                .then(function (res) {
                _this.write(filename, res);
            });
        };
        this.processGlob = function (groupBy) {
            if (groupBy.length == 0) {
                throw new Error('\"groupBy\" must be non empty object');
            }
            var _loop_1 = function (g) {
                var pattern = g.pattern;
                var fileName = g.fileName;
                _this._glob(pattern)
                    .then(function (res) {
                    return _this.load(res);
                })
                    .then(function (res) {
                    _this.write(fileName, res);
                });
            };
            for (var _i = 0, groupBy_1 = groupBy; _i < groupBy_1.length; _i++) {
                var g = groupBy_1[_i];
                _loop_1(g);
            }
        };
        this.ensureDirExists = function (aPath) {
            return new es6_promise_1.Promise(function (resolve, reject) {
                _this.isDirExists(aPath);
                resolve();
            });
        };
        this.isDirExists = function (aPath) {
            var dirname = path.dirname(aPath);
            if (fs.existsSync(dirname)) {
                return;
            }
            _this.isDirExists(dirname);
            try {
                fs.mkdirSync(dirname);
            }
            catch (e) {
                console.error(' unable to create dir ', dirname, e);
            }
        };
        this.options = options;
    }
    return MergeJsonWebpackPlugin;
}());
module.exports = MergeJsonWebpackPlugin;
