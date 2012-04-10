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
VERSION = '0.1.0'
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
  var ver =  color('v'+VERSION,36)
    , port = color(PORT,36)
    , env = process.env.NODE_ENV && process.env.NODE_ENV == app.set('env') ?
            'set '+color(app.set('env'),36)
          : 'defaulted to '+color(app.set('env'),36)
    , now =  color(new Date().format(),36)
    , init = color((new Date()-STARTUPTIME)+'ms',36)

    , welcome =
      [ 'Welcome to '+APPNAME+' '+ver
      , 'Server up on port '+port
      , 'Env '+env
      , 'Init took '+init
      ]

  db.enhancedConnect({
    success: function() {
      console.log('')
      process.title = APPNAME+' (v'+VERSION+')'
      for (var i = 0; i < welcome.length; i++) {
        log.info(welcome[i])
      }
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
