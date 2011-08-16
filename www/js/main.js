define(['js!/socket.io/socket.io.js'], function(io) {
  define('respasff')

  var socket = io.connect('http://localhost')
  socket.on('news', function (data) {
    console.log(socket.socket.sessionid)
    socket.emit('my other event', "{ my: 'data' }")
  })
  socket.on('disconnect', function() {
    console.log('DC')
  })
  socket.on('connecting', function() {
    console.log('reC')
  })
  for (var i = 0; i < 1; i++) {
    console.log(genToken())
  }
  function genToken () {
    var token = ''
    var loops = 8
    var targetLength = 48
    var useOfRandom = Math.pow(2,31)
    while (token.length <= targetLength) {
      token += (Math.random()*useOfRandom|0).toString(36)
    }
    return token.substring(0, targetLength)
  }
})
