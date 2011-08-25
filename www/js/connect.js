define(['cookie', 'socketio'], function(cookie) {
  var c, conn, connect
  c = conn = connect = function(cb) {
    if (typeof cb != 'function') cb = function() {}
    c._connect(function(err, user) {
      console.log(err)
      if (!err) {
        c.established = true
      }
      return cb(err, user)
    })
  }
  c.established = false
  c.getEnvId = function() {
    var eid = c.getEnvId._get()
    if (!eid) eid = c._genEnvId()
    return eid
  }
  c.getEnvId._get = function() {
    return cookie('eid')
  }
  c.getEnvId._set = function(it) {
    cookie('eid', it)
  }

  c._genEnvId = function() {
    var token = ''
    var loops = 8
    var targetLength = 48
    var useOfRandom = Math.pow(2,31)
    while (token.length <= targetLength) {
      token += (Math.random()*useOfRandom|0).toString(36)
    }
    return token.substring(0, targetLength)
  }

  c.socket = {
    emit: function() {
      console.error('connection not ready yet')
    }
  }
  c._connect = function(cb) {
    var socket = io.connect(location.origin)
    var b = c
    c.socket = socket
    console.log(b.socket, c.socket)
    socket.on('connect', function () {
      socket.emit('set envId', c.getEnvId(), function(err, user) {
        return cb(err, user)
      })
    })
  }

  return connect
})