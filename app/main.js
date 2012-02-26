/*\
 *  Main server
 *  Fő szerver
\*/

// Global constant declaration
// Globális konstans deklaráció
  // Not one currently.

// Global variable declaration
// Globális változó deklaráció
STARTUPTIME = new Date().valueOf()
VERSION = '0.0.6'
APPNAME = 'Codename Tali'

// Add directories to path
//var paths = require('./paths.js')

// UncoughtException handling. Init as soon as possible.
// errorHandler = require('errorHandler').init()

var log = require('./log')
  //, settings = exports.settings = require('./settings.js')
  , hlpr = require('./helpers') // prototype extensions also
  , db = require('./db')
  , app = require('./expressServer')
  , socketio = require('./socket')

// TODO reintegrate
// PORT = PORT_OVERRIDE || PORT
app.listen(PORT, function() {
  var color = hlpr.color
  var ver =  '(' + color('v'+VERSION,36) + ')'
    , port = color(PORT,36)
    , env = process.env.NODE_ENV && process.env.NODE_ENV == app.set('env') ?
            'been set to '+color(app.set('env'),36)
          : 'defaulted to '+color(app.set('env'),36)+' (see --help)'
    , now =  color(new Date().format(),36)
    , init = color((new Date()-STARTUPTIME)+'ms',36)
               
    , welcome =
        color('',36)+' ● Welcome to '+APPNAME+'! '+ver
        + '\n ● Main server is up and longing for connections on port '+port
        + '\n ● Enviroment has '+env
        + '\n ● Initialization finished on '+now+', took '+init

  db.enhancedConnect({
    success: function() {
      console.log()
      process.title = APPNAME+' (v'+VERSION+')'
      log.info(welcome)
      console.log('   ―――――――――――――――――――――――――――――――――――――'
        + '―――――――――――――――――――――――――――――――――――――  \n')
    }
  })
  // process.on('SIGINT', function() {
  //   console.log()
  //   log.info(color('   Terminating...',31)+' (SIGINT recieved)'
  //     + '\n ● See you next time!')
  //   process.exit()
  // })
})