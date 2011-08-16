var db = require('mysql').createClient()
  , log = require('log')
  , hlpr = require('helpers')
  , settings = require('settings')

// TODO EPERM error when SQL isn't running
db.enhancedConnect = function(opts) {
  var db = this
    , color = hlpr.color
  if ('object' != typeof opts) opts = {}
  if ('function' != typeof opts.success) opts.success = function() {}
  if ('function' != typeof opts.error) opts.error = function(err) {
    console.log('\n')
    log.fatal(err)
    log.warn("No callback for error handling has been specified.")
    log.info("We cannot do much without a database."
     + "\n\n ● Therefore exiting now...")
    // Have to forcefully exit before we get EPERM error
    process.exit()
  }

  db.host = settings.db.host
  db.port = settings.db.port
  db.user = settings.db.user
  db.password = settings.db.password
  db.database = opts.db || settings.db.database

  db.query('SELECT 1', function(err) {
    if (!err) {
      opts.success()
    }else{
      opts.error()
    }
  })
}

// Exporting
module.exports = db