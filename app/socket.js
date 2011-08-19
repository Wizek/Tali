var app = require('expressServer')
  , io = require('socket.io')
  , io = io.listen(app)
  , log = require('log')

io.sockets.on('connection', function (socket) {
  socket.on('set envId', function (envId, cb) {
    socket.set('envId', envId, function() {
      if (user.tryResume(envId, socket.id)) {
        // resume successful
        return cb()
      } else {
        // resume unsuccessful
        return cb('not logged in')
      }
    })
  })
  socket.on('login', function(username, password) {
    socket.get('envId', function(err, envId) {
      user.login(username, password, envId, socket.id, function(err) {
        if (err) {
          return cb(err)
        } else {
          return cb()
        }
      })
    })
  })
  socket.on('logout', function() {
    socket.get('envId', function(err, envId) {
      user.logout(envId, function(err) {
        return cb()
      })
    })
  })
})