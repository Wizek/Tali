global.debug = true

var paths = require('../../app/paths')
  , user = require('user')

exports['User Session Store'] = function(test) {
  test.expect(8)

  test.equal(typeof user.session, 'function')
  var envId = '0a1b2c3d4e5f'
  var socketId = 123456789012345678

  test.equal(typeof user.session(envId), 'object')
  test.equal(typeof user.session({envId: envId}), 'object')
  test.equal(user.session(envId).get('envId'), envId)
  test.equal(user.session({username: 'Juzer'}), false)
  test.equal(typeof user.session(envId).set('username', 'Juzer'), 'object')
  test.equal(user.session(envId).get('username'), 'Juzer')
  test.equal(user.session({username: 'Juzer'}).get('envId'), envId)
  test.equal(typeof user.session(envId).set('socketId', socketId), 'object')
  test.equal(user.session({socketId: socketId}).get('envId'), envId)
  test.equal(user.session({socketId: socketId}).get('username'), 'Juzer')
  user.session(envId).kill()
  test.equal(user.session(envId).get('username'), undefined)
  test.equal(user.session(envId).get('socketId'), undefined)

  user.session(envId).kill()
  test.done()
}

exports['User Login'] = function (test) {
  test.expect(12)

  test.equal(typeof user.login, 'function')
  test.equal(typeof user.login._sql_login, 'function')

  test.doesNotThrow(function() {
    user.login(null, '', '', '0', function(err) {
      test.equal(err, 'Username must be a String')
    })
    user.login('', null, '', '0', function(err) {
      test.equal(err, 'Password must be a String')
    })
    user.login('', '', null, '0', function(err) {
      test.equal(err, 'EnvId must be a String')
    })
    user.login('', '', '', null, function(err) {
      test.equal(err, 'SocketId must be a Number')
    })
  })
  
  user.login._sql_login = function(username, password, cb) {
    if (username == 'Juzer' && password == 'p4sSwrD') {
      return cb(null, [{count: 1, userid: 1}])
    } else {
      return cb(null, [{count: 0}])
    }
  }
  var envId = '0a1b2c3d4e5f'
  var socketId = '123456789012345678'
  user.login('Username', 'Password', envId, socketId, function(err) {
    test.equal(err, 'Wrong username and password combination')
  })
  user.login('Juzer', 'p4sSwrD', envId, socketId, function(err) {
    test.equal(err, null)
    test.equal(user.session(envId).get('username'), 'Juzer')
    test.equal(user.session(envId).get('socketId'), socketId)
    test.equal(user.session(envId).get('userId'), 1)
  })
  user.login('Juzer', 'p4sSwrD', envId, socketId, function(err) {
    test.equal(err, 'You can not login twice')
  })
  var otherEnvId = '0a1b2c3d4e5g'
  user.login('Juzer', 'p4sSwrD', otherEnvId, socketId, function(err) {
    test.equal(err, null)
    test.equal(user.session(envId).get('username'), undefined)
    test.equal(user.session(envId).get('socketId'), undefined)
    test.equal(user.session(envId).get('userId'), undefined)
  })
  user.session(envId).kill()
  user.session(otherEnvId).kill()
  test.done()
}

exports['User Disconnect'] = function(test) {
  test.expect(6)

  test.equal(typeof user.disconnect, 'function')

  test.doesNotThrow(function() {
    user.disconnect(null, function(err) {
      test.equal(err, 'SocketId must be a Number')
    })
  })

  var envId     = '0a1b2c3d4e5f'
    , socketId  = 123456789012345678
    , mySession = user.session(envId)

  mySession.set('socketId', socketId)
  user.disconnect(socketId)
  test.equal(mySession.get('disconnectedAt'), new Date().toString())
  user.session(envId).kill()
  test.done()
}

exports['User Online'] = function(test) {
  test.expect(3)

  test.equal(typeof user.offlineFor, 'function')

  user.offlineFor._sql_getLastSeen = function(username, cb) {
    return cb(null, {lastSeen: new Date().toString()})
  }
  
  var envId     = '0a1b2c3d4e5f'
  user.session(envId).set('username', 'Juzer')
  user.offlineFor('Juzer', function(err, seconds) {
    test.equal(err, null)
    test.equal(seconds, -1)
  })
  user.session(envId).kill()
  test.done()
}

exports['User Try Resume'] = function(test) {
  test.expect(8)

  test.equal(typeof user.tryResume, 'function')

  test.doesNotThrow(function() {
    user.tryResume(null, 0, function(err) {
      test.equal(err, 'EnvId must be a String')
    })
    user.tryResume('', null, function(err) {
      test.equal(err, 'NewSocketId must be a Number')
    })
  })

  var envId = '0a1b2c3d4e5f'
  var socketId = '123456789012345678'
  user.login('Juzer', 'p4sSwrD', envId, socketId, function(err) {
    test.equal(err, null)
    user.disconnect(socketId, function() {
      user.session('Juzer').set('envId','0a1b2c3d4e5f')
      user.session('Juzer').get('disconnectedAt').setMinutes(
        user.session('Juzer').get('disconnectedAt').getMinutes() - 3
      )
      var envId = user.session('Juzer').get('envId')
      // trying to resume the session after 3 minutes
      var newSocketId = 141241535354542324
      user.tryResume('falseEnvironmentId', newSocketId, function(err, username) {
        test.equal(err, 'You were not logged in at this environment')
        user.tryResume(envId, newSocketId, function(err, username) {
          test.equal(username, 'Juzer')
          test.equal(user.session('Juzer').get('socketId'), newSocketId)
          user.session('Juzer').kill()
          test.done()
        })
      })
    })
  })
}

exports['User Logout'] = function(test) {
  test.expect(6)

  test.equal(typeof user.logout, 'function')

  test.doesNotThrow(function() {
    user.logout(null, function(err) {
      test.equal(err, 'EnvId must be a String')
    })
  })

  user.logout._sql_updateLastSeen = function(username, cb) {
    return cb(null, {affectedRows: 1})
  }

  var envId = '0a1b2c3d4e5f'
  var socketId = '123456789012345678'
  user.login('Juzer', 'p4sSwrD', envId, socketId, function(err) {
    test.equal(err, null)
    user.logout(envId, function(err) {
      test.equal(err, null)
      user.offlineFor('Juzer', function(seconds) {
        test.ok(seconds >= 0)
        test.done()
      })
    })
  })
}

exports['User Set Focus'] = function(test) {
  test.expect(6)

  test.equal(typeof user.setFocus, 'function')

  test.doesNotThrow(function() {
    user.setFocus(null, '', function(err) {
      test.equal(err, 'NodeId must be a Number')
    })
    user.setFocus(1, null, function(err) {
      test.equal(err, 'Username must be a String')
    })
  })

  user.setFocus(1, 'Juzer', function(err) {
    test.equal(err, null)
    test.equal(user._onlineStore['Juzer']['focus'], 1)
    test.done()
  })

}

exports['User Lock Node'] = function(test) {
  test.expect(8)

  test.equal(typeof user.lock, 'function')

  test.doesNotThrow(function() {
    user.lock(null, '', function(err) {
      test.equal(err, 'NodeId must be a Number')
    })
    user.lock(1, null, function(err) {
      test.equal(err, 'Username must be a String')
    })
  })

  user.lock(1, 'Juzer', function(err) {
    test.equal(err, null)
    test.equal(user._onlineStore['Juzer']['lock'], 1)
    user.lock(1, 'Juzer2', function(err) {
      test.equal(err, 'Node already locked by Juzer')
      test.equal(user._onlineStore['Juzer']['lock'], 1)
      user._onlineStore['Juzer']['lock'] = null
      test.done()
    })
  })
}

exports['User Unlock All'] = function(test) {
  test.expect(6)

  test.equal(typeof user.unlock, 'function')

  test.doesNotThrow(function() {
    user.unlock(null, function(err) {
      test.equal(err, 'Username must be a String')
    })
  })
  user.lock(1, 'Juzer', function(err) {
    test.equal(err, null)
    user.unlock('Juzer', function(err) {
      test.equal(err, null)
      test.equal(user._onlineStore['Juzer']['lock'], null)
      test.done()
    })
  })
}

exports['User Register'] = function(test) {
  test.expect(16)

  test.equal(typeof user.register, 'function')
  test.equal(typeof user.register._sql_checkUsername, 'function')
  test.equal(typeof user.register._sql_register, 'function')

  test.doesNotThrow(function() {
    user.register(null, '', '', function(err) {
      test.equal(err, 'Username must be a String')
    })
    user.register('', null, '', function(err) {
      test.equal(err, 'Password must be a String')
    })
    user.register('', '', null, function(err) {
      test.equal(err, 'Email must be a String')
    })
  })

  user.register._sql_checkUsername = function(username, cb) {
    if (username == 'Fodi69') {
      cb(null, [{username: 'Fodi69'}])
    } else {
      cb(null, [])
    }
  }
  user.register._sql_register = function(username, password_type, password, email, cb) {
    cb(null, {insertId: 1234})
  }
  user.register('t', 'test', 'test@test.hu', function(err) {
    test.equal(err, 'Username length must be within 2 and 16 character')
  })
  user.register('#ß÷%', 'test', 'test@test.hu', function(err) {
    test.equal(err, 'Username can only contain characters from the hungarian alphabet and numbers')
  })
  user.register('test', 'test', 'test@test.hu', function(err) {
    test.equal(err, 'Password length must be at least 8 character')
  })
  user.register('test', 'testtest', 'test@test.hu', function(err) {
    test.equal(err, 'Password must contain at least 1 number')
  })
  user.register('test', 'testtest12', 'test@test', function(err) {
    test.equal(err, 'Wrong email address')
  })
  user.register('test', 'testtest12', 'test.hu', function(err) {
    test.equal(err, 'Wrong email address')
  })
  user.register('Fodi69', 'testtest12', 'test@test.hu', function(err) {
    test.equal(err, 'This username is already taken')
  })
  user.register('test', 'testtest12', 'test@test.hu', function(err, userid) {
    test.equal(err, null)
    test.equal(userid, 1234)
  })
  test.done()
}
