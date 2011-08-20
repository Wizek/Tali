var app = require('expressServer')
  , io = require('socket.io')
  , io = io.listen(app)
  , log = require('log')
  , user = require('user')

io.sockets.on('connection', function (socket) {
  socket.on('set envID', function (envID, cb) {
    socket.set('envID', envID, function() {
      user.tryResume(envID, socket.id, cb) 
    })
  })
  socket.on('login', function(username, password) {
    socket.get('envID', function(err, envID) {
      user.login(username, password, envID, socket.id, cb)
    })
  })
  socket.on('logout', function() {
    socket.get('envID', function(err, envID) {
      user.logout(envID, cb)
    })
  })
})