var app = require('expressServer')
  , io = require('socket.io')
  , io = io.listen(app)
  , log = require('log')

io.sockets.on('connection', function (socket) {
  socket.on('token', function (data) {
    console.log(data)
  })
})