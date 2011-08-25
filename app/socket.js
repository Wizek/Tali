var app = require('expressServer')
  , io = require('socket.io')
  , io = io.listen(app)
  , log = require('log')
  , user = require('user')
  , node = require('node')

io.sockets.on('connection', function (socket) {
  var counter = 0
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
    socket.on('set focus', function(nodeId, cb) {
      socket.get('username', function(err, username) {
        user.setFocus(nodeId, username, cb)
        socket.broadcast.emit('change focus', nodeId, username)
      })
    })
    socket.on('get children of', function(nodeId, cb) {
      node.getLevel(nodeId, cb)
    })
    socket.on('lock', function(nodeId, cb) {
      socket.get('username', function(err, username) {
        user.lock(nodeId, username, cb)
        socket.broadcast.emit('change lock', nodeId, username)
      })
    })
    socket.on('unlock', function(cb) {
      socket.get('username', function(err, username) {
        user.unlock(username, cb)
      })
    })
    socket.on('edit headline', function(nodeId, newText, cb) {
      socket.get('userId', function(err, userId) {
        node.editHeadline(nodeId, newText, userId, cb)
        socket.get('username', function(err, username) {
          socket.broadcast.emit('change headline', nodeId, newText, username)
        })
      })
    })
    socket.on('edit body', function(nodeId, newText, cb) {
      socket.get('userId', function(err, userId) {
        node.editBody(nodeId, newText, userId, cb)
        socket.get('username', function(err, username) {
          socket.broadcast.emit('change body', nodeId, newText, username)
        })
      })
    })
  }
})
