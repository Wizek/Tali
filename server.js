#!/usr/bin/env node

var app = module.exports = require('railway').createServer();

if (!module.parent) {
    var port = process.env.PORT || 3000
    app.listen(port, app.onListen || function() {})
    console.log("Railway server listening on port %d within %s environment", port, app.settings.env);
}

