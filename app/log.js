var fs = require('fs')
  , Spruce = require('spruce')
  , settings = require('./settings')
  require('./helpers')

/*\
 *  Set up logging
\*/

// some shorthands
var methods = settings.spruce.methods
  , debug = methods.debug
  , info = methods.info
  , warn = methods.warn
  , error = methods.error
  , fatal = methods.fatal

// Custom console output handler
debug.custumConsole =
info.custumConsole =
warn.custumConsole =
error.custumConsole =
fatal.custumConsole = function() {
  var args = arguments
    , str = ''
  str = this.colorize(this.getStringContent.apply(null, args))
  str = str.length > 108 ? str.replace(' - ', ' =>\n') : str

  process.stdout.write(str+'\n')
}

// Opening writable file streams for the logging channels
var logFolder = (settings.paths.logFolder || "./logs")+"/"
function getLogFD (specific) { // file descriptor
  var fd = null
    , logFileName = specific || settings.paths.logFileName

  fd = fs.createWriteStream(logFolder+logFileName, {flags:'a'})
  return fd
}

try{
  fs.mkdirSync(logFolder, 0666)
  var logfile = getLogFD(new Date().format('date')+'.log')
}catch(err) {
  if (err.code == 'EEXIST') {
    var logfile = getLogFD(new Date().format('date')+'.log')
  }else{
    console.error('Error while creating nonexistent logs folder. Details:', err)
    var logfile = { write: function() { /* I'm an empty function. */ } }
  }
}
logfile.write('\r\n')

debug.writableStream =
info.writableStream  =
warn.writableStream  =
error.writableStream =
fatal.writableStream = logfile

// Specifying what to output to fileStreams
debug.streamHandler =
info.streamHandler =
warn.streamHandler =
error.streamHandler =
fatal.streamHandler = function() {
  var args = arguments
  for (var i = 0; i < args.length; i++) {
    args[i] = removeColors(args[i])
  }
  var str = this.getStringContent.apply(null, args)
  return str + '\r\n'

  function removeColors (str) {
    return 'string' == typeof str ?
        str.replace(/\033\[[\d;]*m/g,'')
      : str
  }
}

// Initializing
var log = Spruce.init(settings.spruce)

/*\ R.I.P. "li'lbit of console fun ^^"                                  _
 *    2011-05-20 ;_; // Murderer: Fodi69                              _| |_
 *    -- The one who brought joy to people's lives.                  |_   _| 
 *                                                                     | |
 * // log.info("Initialising...^")                                     |_|
 * // dots = setInterval(function() { process.stdout.write(".")}, 17)  \*/

// Exporting
module.exports = log

/*
setLogFile(true)
function setLogFile (justSetTheTimeout) {
  var tmp = {}
  tmp.trgtStr = new Date().toISOString().replace(/T.*Z/, 'T23:59:59.999Z')
  tmp.trgtVal = new Date(tmp.trgtStr).valueOf()
  tmp.currVal = Date.now()
  tmp.diffVal = tmp.trgtVal - tmp.currVal
  if (!justSetTheTimeout) {
    log.warn('LogFile is about to be swapped.')
    log.debug('[tmp]', tmp)
    logFolder = _mainDir+(settings.paths.logFolder || "./logs")+"/"
    var fd = getLogFD(new Date().format('date')+".log")
    debug.writableStream =
    info.writableStream  =
    warn.writableStream  =
    error.writableStream =
    fatal.writableStream = fd
    log.debug('FILENAME', new Date().format('date')+'.log')
    log.warn('LogFile has just been swapped.')
  }
  return setTimeout(arguments.callee, tmp.diffVal)
}*/