// Makes socket.io AMD compliant, returns our socket as singleton
define(['io.amd'], function(io) {
  var socket = io.connect(location.origin)
  return socket
})