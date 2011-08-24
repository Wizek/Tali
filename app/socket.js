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
      user.tryResume(envId, socket.id, function(err, username, userId, onlineList) {
        if (!err) {
          socket.set('username', username, function() {
            socket.set('userId', userId, function() {
              socket.broadcast.emit('user joined', username, user._onlineStore[username])
            })
          })
        }
        return cb(err, username, userId, onlineList)
      })
    })
  })
  socket.on('login', function(username, password, cb) {
    socket.get('envId', function(err, envId) {
      user.login(username, password, envId, socket.id, function(err, userId) {
        if (!err) {
          socket.broadcast.emit('user joined', username, user._onlineStore[username])
          socket.set('username', username)
          socket.set('userId', userId)
          counter++
          if (counter <= 1) {
            afterAuth()
          }
        }
        return cb(err, userId)
      })
    })
  })
  socket.on('disconnect', function() {
    socket.get('username', function(err, username) {
      socket.broadcast.emit('user left', username)
      user.disconnect(socket.id)
    })
  })
  socket.on('logout', function(cb) {
    socket.get('envId', function(err, envId) {
      user.logout(envId, cb)
    })
  })
  socket.on('register', function(username, password, email, cb) {
    user.register(username, password, email, cb)
  })
  afterAuth = function() {
    /*socket.on('set focus', function(nodeId, cb) {
      user.setFocus(nodeId, cb)
    })*/
    socket.on('get children of', function(id, cb) {
      node.getLevel(id, cb)
    })
    socket.on('edit headline', function(id, newText, cb) {
      socket.get('userId', function(err, userId) {
        node.editHeadline(id, newText, userId, cb)
        socket.broadcast.emit('change headline', id, newText)
      })
    })
    socket.on('edit body', function(id, newText, cb) {
      node.editBody(id, newText, userId, cb)
      socket.broadcast.emit('change body', id, newText, userId)
    })
  }
})
