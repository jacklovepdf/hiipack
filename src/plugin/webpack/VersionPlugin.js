/**
 * @file
 * @author zdying
 */
var fs = require('fs');
var path = require('path');

var md5File = require('md5-file');

function VersionPlugin(hashLength, pattern){
    hashLength = hashLength || 6;

    if(pattern && typeof pattern.test !== 'function'){
        console.log('[error]'.red, 'invalid pattern param.');
        return function(){}
    }

    return function(){
        this.plugin("done", function(stats){
            var lines = [];
            var versions = {};
            var assets = stats.compilation.assets;
            var context = stats.compilation.compiler.context;
            var config = stats.compilation.compiler.options;

            var handerChunk = function(fileName, filePath){
                if(!pattern || !(pattern && pattern.test(fileName))){
                    var md5 = md5File.sync(filePath);
                    md5 = md5.slice(0, hashLength);
                    fs.rename(filePath, filePath.replace(/\.(js|css)$/, '@' + md5 + '.$1'), function(err){
                        if(err) console.log('[ERROR]'.bold.red, err.message);
                    });
                    lines.push(fileName + '#' + md5);
                    versions[fileName] = md5;
                }
            };

            for(var fileName in assets){
                var info = assets[fileName];
                var filePath = info.existsAt;

                handerChunk(fileName, filePath);
            }

            if(config.replaceVersion){
                var root = path.resolve(__hii__.cwd, config.replaceVersion);
                fs.readdir(root, function (err, files) {
                    if(err){
                        // console.log(err)
                    }else{
                        files.forEach(function(file){
                            if(!file.match(/\.(htm|html)/)){
                                return
                            }
                            var filePath = root + '/' + file;
                            var oldStr = fs.readFileSync(filePath).toString();

                            var newStr = oldStr.replace(/\/([^\/]*?)@(\w+)\.(js|css)/g, function(match, fileName, version, fileExt){
                                var ver = versions[fileName + '.' + fileExt];
                                if(ver){
                                    console.log('');
                                    return '/' + fileName + '@' + ver + '.' + fileExt;
                                }else{
                                    return match;
                                }
                            });

                            newStr && fs.writeFile(filePath, newStr, function(err){
                                if(err){ return console.log(err) }
                                console.log('[debug]', filePath, '版本号替换成功.');
                            })
                        })
                    }
                });
            }

            fs.mkdir(context + '/ver', function(err){
                var path = context + "/ver/versions.mapping";
                var isExists = fs.existsSync(path);

                if(isExists){
                    fs.writeFile(path, '\n' + lines.join('\n'), {flag: 'a'});
                }else{
                    fs.writeFile(path, lines.join('\n'));
                }
            });
        });
    }
}

module.exports = VersionPlugin;
