/**
 * @file
 * @author zdying
 */
var __hiipack = require('./global');
var express = require('express');
var path = require('path');
var fs = require('fs');
var fse = require('fs-extra');
var colors = require('colors');
var child_process = require('child_process');
var os = require('os');

var server = require('./server');
var client = require('./client');
var package = require('../package.json');
var program = global.program;

try{
    fse.copy(path.resolve(__hiipack__.root, 'tmpl', '_cache'), __hiipack__.tmpdir, function(err){
        if(err) console.error(err);
    });

    fse.copy(path.resolve(__hiipack__.root, 'tmpl', '_cache'), __hiipack__.tmpdirWithVersion, function(err){
        if(err) console.error(err);
    });
}catch(e){

}

// console.log('__hiipack__.root'.bold.magenta, '==>', __hiipack_root__);
// console.log('__hiipack__.cwd '.bold.magenta, '==>', __hiipack_cwd__);
// console.log(process.env.NODE_PATH);

program
    .version(package.version, '-v, --version')
    .option('-o, --open [open]', 'open in browser, one of: chrome|firefox|safari|opera', /^(chrome|firefox|safari|opera)$/)
    .option('-p, --port <port>', 'service port', 8800)
    .option('-r, --registry <registry>', 'npm registry address')
    .option('-d, --debug', 'print debug log')
    .option('-s, --syncConf <syncConf>', 'custom sync config')
    //TODO add this next version
    // .option('-U, --uglify', 'uglify javascript')
    //TODO add this next version
    // .option('-e, --extract-css', 'extract css from javascript')
    .option('-D, --detail', 'print debug and error detail log')
    // .option('-w, --workspace <workspace>', 'workspace', process.cwd())
    .option('-x, --proxy', 'start the proxy server')
    .option('-t, --type <type>', 'project type: one of react|react-redux|es6|vue|normal|empty', /^(react|react-redux|es6|vue|normal|empty)$/, 'normal')
    .option('--no-color', 'disable log color');

program
    .command('init <name>')
    .description('initialize project')
    .action(function(name){
        client.init(name, program.type, program.registry);
    });

program
    .command('start')
    .description('create a local server')
    .action(function(){
        var open = false;

        if(program.open){
            open = typeof program.open === 'string' ? program.open : 'chrome';
        }

        server.start(program.port, open, program.proxy);
    });

program
    .command('min')
    .description('compress/obfuscate project files')
    .action(function(){
        client.build();
    });

program
    .command('pack')
    .description('pack project files')
    .action(function(){
        client.pack();
    });

program
    .command('sync')
    .description('synchronize the current directory to remote server')
    .action(function(){
        client.sync(program.syncConf);
    });

program
    .command('test')
    .description('run unit test')
    .action(function(){
        client.test();
    });

program
    .command('clear')
    .description('clear resulting folders of hiipack')
    .action(function(){
        fse.remove('dev');
        fse.remove('prd');
        fse.remove('ver');
        fse.remove('loc');
        fse.remove('dll');
        // child_process.exec('rm -rdf dll loc dev prd ver')
    });

program
    .command('config [operation] [args...]')
    .description('hiipack config, `operation`: [empty]|list|set|delete')
    .action(function(ope, args, options){
        client.config(ope, args)
    });

program.on('--help', function(){
    console.log('  Examples:');
    console.log('');
    console.log('    $ hii init project_name');
    console.log('    $ hii start');
    console.log('    $ hii start -p 8800');
    console.log('    $ hii pack');
    console.log('    $ hii sync');
    console.log('    $ hii min');
    console.log('');
    console.log('  Wiki:');
    console.log('');
    console.log('    https://github.com/zdying/hiipack/wiki/hiipack-%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E');
});

program.parse(process.argv);

if(process.argv.length == 2){
    showVersion();
}

function showVersion(){
    var version = package.version.magenta;
    var versionLen = version.length;
    var spaces = new Array(25 - versionLen + 3).join(' ');

    console.log('');
    console.log('  .-----------------------------.');
    console.log('  |  ' + 'hiipack'.bold + ' ' + version + spaces + '  |');
    console.log('  |  ' + 'author ', 'zdying@live.com'.yellow.bold + '    |');
    console.log('  |  ' + 'github.com/zdying/hiipack'.green.underline + '  |');
    console.log('  \'-----------------------------\'');
    console.log('');
}