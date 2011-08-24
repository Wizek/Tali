var app = require('expressServer')
  , io = require('socket.io')
  , io = io.listen(app)
  , log = require('log')
  , user = require('user')
  , node = require('node')

var counter = 0
io.sockets.on('connection', function (socket) {
  socket.on('set envId', function (envId, cb) {
    socket.set('envId', envId, function() {
      user.tryResume(envId, socket.id, cb)
    })
  })
  socket.on('login', function(username, password, cb) {
    socket.get('envId', function(err, envId) {
      counter++
      if (counter <= 1) {
        /*socket.on('set focus', function(nodeId, cb) {
          user.setFocus(nodeId, cb)
        })*/
        socket.on('get children of', function(id, cb) {
          node.getLevel(id, cb)
        })
      }
      user.login(username, password, envId, socket.id, cb)
    })
  })
  socket.on('disconnect', function(cb) {
    user.disconnect(socket.id, cb)
  })
  socket.on('logout', function(cb) {
    socket.get('envId', function(err, envId) {
      user.logout(envId, cb)
    })
  })
  socket.on('register', function(username, password, email, cb) {
    user.register(username, password, email, cb)
  })
})
