/**
 * @file
 * @author zdying
 */
var express = require('express');
var colors = require('colors');
var path = require('path');
var fs = require('fs');
var os = require('os');

var logger = log.namespace('Server');
var ProxyServer = require('../proxy');
var detectBrowser = require('./detectBrowser');
var proxyConfig = require('./proxyConfig');

// 中间件
var preHandler = require('./middlewares/preHandler');
var favicon = require('./middlewares/favicon');
var compileSource = require('./middlewares/compileSource');
var webpackHMR = require('./middlewares/webpackHMR');

function Server(port, browser, proxy){
    this.app = express();
    this.compilers = {};
    this.proxyServer = null;
    this.port = port;
    this.browser = browser;
    this.proxy = proxy;
}

Server.prototype = {
    constructor: Server,

    start: function(){
        var port = this.port;
        var app = this.app;

        // 请求预处理：去掉url中的hash和参数等
        app.all('*', preHandler);

        // webpack hot module replace
        app.get('/__webpack_hmr', webpackHMR);

        // favicon.ico
        app.get('/favicon.ico', favicon.bind(this));

        app.get(/[\w\d]+\.hot\-update\.json([\#\?].*)?$/, function(req, res, next){
            this.sendFile(req, path.join(__hii__.codeTmpdir, req.url))
        }.bind(this));

        // 编译代码的主要逻辑
        app.all('*', compileSource.bind(this));

        this.server = app.listen(port);

        this.initEvents();
    },

    initEvents: function(){
        var server = this.server;
        var port = this.port;
        var proxy = this.proxy;
        var browser = this.browser;

        server.on('error', function(err){
            if(err.code === 'EADDRINUSE'){
                console.log('port', String(port).bold.yellow, 'is already in use.');
                server.close();
            }else{
                console.log(err.message);
            }
        });

        server.on('listening', function(){
            var url = 'http://127.0.0.1:' + port;
            // browser && open(url);

            browser && this.openBrowser(url);

            console.log();
            console.log('current workspace ', __hiipack__.cwd.green.bold);
            console.log('hiipack started at', url.green.bold);

            if(proxy){
                // 启动代理服务
                this.proxyServer = new ProxyServer();
                this.proxyServer.start(4936);
            }

            setTimeout(function(){
                log.debug('__hii__', '-',  JSON.stringify(__hiipack__));
            }, 200)
        }.bind(this));

        process.on("SIGINT", function(){
            console.log('\b\b  ');
            console.log('Bye Bye.'.bold.yellow);
            process.exit()
        });

        process.on('SIGTERM', function(){
            console.log('Bye Bye.'.bold.yellow);
            process.exit()
        });
    },

    openBrowser: function(url){
        var browser = this.browser;

        // Firefox pac set
        // http://www.indexdata.com/connector-platform/enginedoc/proxy-auto.html
        // http://kb.mozillazine.org/Network.proxy.autoconfig_url
        // user_pref("network.proxy.autoconfig_url", "http://us2.indexdata.com:9005/id/cf.pac");
        // user_pref("network.proxy.type", 2);

        var browserPath = detectBrowser(browser);

        if(!browserPath){
            log.error('can not find browser', browser.bold.yellow);
        }else{
            var dataDir = __hii__.tmpdir;

            if(os.platform() === 'win32'){
                browserPath = '"' + browserPath + '"';
            }

            var command = browserPath + ' ' + proxyConfig[browser](dataDir, url, browserPath);
            // var command = browserPath + ' --proxy-server="http://127.0.0.1:' + 4936 + '"  --user-data-dir='+ dataDir +'  --lang=local  ' + url;
            log.debug('open ==> ', command);
            require('child_process').exec(command, function(err){
                if(err){
                    console.log(err);
                }
            });
        }
    },

    /**
     * 发送文件
     * @param req
     * @param filePath
     * @param env
     */
    sendFile: function(req, filePath){
        filePath = filePath || path.join(__hii__.cwd, req.url);

        logger.debug('send file: ' + filePath.bold);

        var res = req.res;

        res.set('Access-Control-Allow-Origin', '*');

        res.sendFile(filePath, function(err){
            if(err){
                res.statusCode = 404;
                res.end('404 Not Found');
                logger.error(err);
            }
            logger.access(req);
        });
    },

    getProjectInfoFromURL: function(url){
        //  url,  projectName,    env,    folder, fileName, version, fileExt,     paramsAndHash
        var reg = /\/(.*?)\/(src|prd|loc|dev)(\/.*)?\/(.*?)(@\w+)?(?:\.(\w+))([\#\?].*)?$/;
        var result = url.match(reg);

        if(result){
            return {
                projectName: result[1],
                env: result[2],
                folder: result[3],
                fileName: result[4],
                version: result[5],
                fileExt: result[6],
                paramsAndHash: result[7]
            }
        }else{
            return null
        }
    },

    sendCompiledFile: function(req, projInfo){
        var filePath = __hii__.codeTmpdir + req.url;
        filePath = filePath.replace(/@[\w+]+\.(js|css)/, '.$1').replace(/\/prd\//, '/loc/');
        this.sendFile(req, filePath);
        // var content = mfs.readFileSync(filePath)//.toString();
        // req.res.setHeader('Content-Type', 'text/javascript');
        // req.res.setHeader('Content-Length', content.length);
        // req.res.send(content)
    }
};

// function publish(data){
//     for(var id in clients){
//         clients[id].write("data: " + JSON.stringify(data) + "\n\n");
//     }
// }
//
// function buildModuleMap(modules){
//     var map = {};
//     modules.forEach(function(module){
//         map[module.id] = module.name;
//     });
//     return map;
// }

module.exports = Server;