// Load requisits
// Külső modulok betöltése
//
// *                Node's built in modules
// ./lib/           Own libraries taht may be reused with another server app
// ./modules/       Server interface modularity
// ./node_modules/  3rd party modules for Node.js

    // *  ------------------------  Node's built in modules
var
  //, Crypto = require('crypto') // removed dependency Crypto
    // ./node_modules/  ----------  3rd party modules for Node.js
    express = require('express')
    // ./lib/  -------------------  Own libraries that may be reused 
  , db = require('db')
  , hlpr = require('helpers') // prototype extensions also
  , settings = exports.settings = require('settings')
    // ./modules/  ---------------  Server interface modularity
      // Yet to come

/*\
 *  Initializing main server
 *  A szerver inicializációja
\*/

var app = module.exports = express.createServer()

// basic configuration that's needed regardless of enviroment
// Alapvető konfiguráció ami környezetfüggetlenül szükséges
app.configure(function() {
  app.use(express.favicon('www/favicon.ico'))
  app.use(express.logger(/*hlpr.colorfulLoggerFn*/))
  app.use(express.static('www'))
  app.use(nothingFound)
})
// config to be run in dev enviroment
// Fejlesztői környezetbéli beállítások
app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
  PORT = settings.ports.development
})
// production enviroment configuration
// Produkciós környezetbéli beállítások
app.configure('dev2', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
  PORT = settings.ports.secondary_development
})

app.configure('production', function() {
  app.use(express.errorHandler()); 
  PORT = settings.ports.production
})

// Last resort: requests fall down here when nothing fulfilled them up there
// Végső mencsvár: Minden kérés ami nem telejsült ide jut végül.
function nothingFound (req, res, next) {
  // TODO: Send it with 404 HTTP error status code!!
  if (req.accepts('json')) {
    res.send({error: "Not found"}, 404)
  }else{
    res.doSendInstead('/404.html')
  }
}

// reintegrate from hlpr
var ___notFinished___ = hlpr.___notFinished___