var express     = require('express')

var store = new express.session.MemoryStore

app.configure(function(){
  var cwd = process.cwd()
  /*app.use(function(_, r) {
    r.send(app)
  })*/
  app.use(require('stylus').middleware({
        force: true
      , src: app.root + '/app/assets/stylesheets'
      , dest: app.root + '/public/stylesheets'
      , compress: false
      // , debug: true
  }))


  app.use(express.static(cwd + '/public', {maxAge: 86400000}))
  app.set('views', cwd + '/app/views')
  // app.set('view engine', 'ejs')
  app.set('view engine', 'jade')
  app.set('view options', {complexNames: true})
  app.set('jsDirectory', '/javascripts/')
  app.set('cssDirectory', '/stylesheets/')
  app.set('defaultLocale', 'hu')
  app.use(express.bodyParser())
  app.use(express.cookieParser('secret'))
  app.use(express.session({secret: 'jk4xbrXKDPVyx56s', store: store}))
  app.use(express.methodOverride())
  app.use(app.router)
})


app.onListen = function() {
  app.sio = require('socket.io').listen(app)

  app.sio.configure(function() {
    app.sio.set('authorization', function(handshakeData, cb) {
      var socketCookie = require('connect').utils.parseCookie(handshakeData.headers.cookie)
      socketCookieKey = socketCookie['connect.sid']
      if (store.sessions[socketCookieKey]) {
        var cookieData = JSON.parse(store.sessions[socketCookieKey])
        if (cookieData.user) {
          cb(null, true)
        }
      }
      // TODO
      // cb(null, false)
      cb(null, true)
    })
  })

  app.sio.sockets.on('connection', function(socket) {

    debugger

    // Let's go through app.sio.watched
    for (var key in app.sio.watched) if (app.sio.watched.hasOwnProperty(key)) {
      if (socket._events[key]) {
        // This will rarely happen, as event listeners populate themselves with
        // functions on a per-connection basis.
        // But even if it happens, the code below ensures that always the latest
        // version of the functions are used.
        console.log('socket._events already had', key)
      } else {
        console.log('socket._events didn\'t have', key)
        // Read above why this isn't only `socket.on(key, app.sio.watched[key])`
        void function(key) {
          socket.on(key, function() {
            app.sio.watched[key].apply(this, arguments)
          })
        }(key)
      }
    }

  })
}

