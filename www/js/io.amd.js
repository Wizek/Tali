// Makes socket.io AMD compliant, returns the once global io variable
define(['socketio'], function() {
  if (!window.io) return console.error('No global io defined!')
  var io = window.io
  // Get rid of that nasty global variable!
  delete window.io
  return io
})