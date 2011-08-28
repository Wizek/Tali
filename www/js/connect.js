// ### Purpose:
//
//  - @dependencies
//    - RequireJS
//    - socket.amd
//    - cookie
//  - @constructor
//  - @returns
//
//  **********************************************************************

// Asyncronous Module Definition
define(['cookie'], function(cookie) {
  var c, conn, connect

  c = conn = connect = function(cb) {
    if (typeof cb != 'function') cb = function() {}
      c._connect(function(err, user) {
      if (!err) {
        c.established = true
      }
      return cb(err, user)
    })
  }

  c.established = false
  c.getEnvId = function() {
    var eid = c.getEnvId._get()
    if (!eid) {
      eid = c._genEnvId()
      c.getEnvId._set(eid)
    }
    return eid
  }

  c.getEnvId._get = function() {
    //console.log(cookie('eid'))
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
    require(['socket.amd'], function(socket) {
      socket.on('connect', function () {
        console.log(c.getEnvId())
        console.log(c.getEnvId())
        socket.emit('set envId', c.getEnvId(), function(err, user) {
          return cb(err, user)
        })
      })
    })
  }

  return connect
})