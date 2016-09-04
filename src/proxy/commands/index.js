/**
 * @file rewrite指令
 * @author zdying
 */

module.exports = {
    // ## proxy request config
    'proxy_set_header': function(key, value){
        log.debug('proxy_set_header -', this, key, value);
        this.request.headers[key] = value;
    },
    'proxy_del_header': function(key, value){
        log.debug('proxy_del_header -', this, key, value);
        delete this.request.headers[key];
    },
    'proxy_set_cookie': function(key, value){
        log.debug('proxy_set_cookie -', this, key, value);
    },
    'proxy_del_cookie': function(key){
        log.debug('proxy_del_cookie -', this, key, value);
    },

    // ## response config
    'hide_cookie': function(key){
        this.response.headers['Set-Cookie'] = key + '=; Expires=' + new Date(1);
    },
    'hide_header': function(key, value){
        log.debug('hide_header -', this, key, value);
        delete this.response.headers[key];
    },
    'set_header': function(key, value){
        log.debug('set_header -', this, key, value);
        this.response.headers[key] = value;
    },
    'set_cookie': function(key, value){
        log.debug('set_cookie -', this, key, value);
        this.response.headers['Set-Cookie'] = key + '=' + value;
    }
};