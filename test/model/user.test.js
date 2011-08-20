var user = require('../../app/model/user.js')

exports['User Login'] = function (test) {
  test.expect(9)

  test.equal(typeof user.login, 'function')
  test.equal(typeof user.login._sql_login, 'function')

  user.login._sql_login = function(username, password, cb) {
    if (username == 'Juzer' && password == 'p4sSwrD') {
      return cb() // FIXME: use count()'s result instead!
    } else {
      return cb('Error')
    }
  }
  var envId = '0a1b2c3d4e5f'
  var socketId = 123456789012345678
  user.login('', 'Password', envId, socketId, function(err) {
    test.equal(err, 'Felhasználónév megadás kötelező!')
  })
  user.login('asdasd', '', envId, socketId, function(err) {
    test.equal(err, 'Jelszó megadás kötelező!')
  })
  user.login('Username', 'Password', envId, socketId, function(err) {
    test.equal(err, 'Nem megfelelő felhasználónév és jelszó kombináció!')
  })
  user.login('Juzer', 'p4sSwrD', envId, socketId, function(err) {
    test.equal(err, null)
    test.equal(user.session('Juzer').get('envId'), envId)
    test.equal(user.session('Juzer').get('socketId'), socketId)
  })
  user.login('Juzer', 'p4sSwrD', envId, socketId, function(err) {
    test.equal(err, 'Nem jelentkezhetsz be kétszer! Előbb jelentkezz ki!')
  })
  user.session('Juzer').kill()
  test.done()
}

exports['User Session Store'] = function(test) {
  test.expect(7)

  test.equal(typeof user.session, 'function')
  var key = 'Session key'
  var value = 'Session value'

  test.equal(user.session('Juzer').exists, false)
  user.session('Juzer').init()
  test.equal(user.session('Juzer').exists, true)
  test.equal(user.session('Juzer').get('username'), 'Juzer')
  user.session('Juzer').kill()

  user.session('Juzer').set(key, value)
  test.equal(user.session({username: 'Juzer'}).get(key), value)
  test.equal(user.session({'Session key': value}).get('username'), 'Juzer')
  user.session('Juzer').kill()
  
  test.equal(user.session('Juzer').exists, false)
  test.done()
}

exports['User Online'] = function(test) {
  test.expect(3)

  test.equal(typeof user.offlineFor, 'function')

  user.offlineFor._sql_getLastSeen = function(username, cb) {
    return cb(null, {lastSeen: new Date().toString()})
  }
  
  user.session('Juzer').init()
  user.offlineFor('Juzer', function(err, seconds) {
    test.equal(err, null)
    // Still online
    test.equal(seconds, -1)
  })
  user.session('Juzer').kill()
  test.done()
}

exports['User Disconnect'] = function(test) {
  test.expect(4)

  test.equal(typeof user.disconnect, 'function')
  user.session('Juzer').init()
  user.disconnect('Juzer')
  //Ensure that he was in the last 3 seconds online
  user.offlineFor('Juzer', function(err, offlineFor) {
    test.equal(err, null)
    test.ok(offlineFor <= 3)
    test.ok(offlineFor >= 0)
    test.done()
  })
}

exports['User Try Resume'] = function(test) {
  test.expect(5)

  test.equal(typeof user.tryResume, 'function')

  var envId = '0a1b2c3d4e5f'
  var socketId = 123456789012345678
  user.login('Juzer', 'p4sSwrD', envId, socketId, function(err) {
    test.equal(err, null)
    user.disconnect('Juzer')
    user.session('Juzer').set('envId','0a1b2c3d4e5f')
    user.session('Juzer').get('disconnectedAt').setMinutes(
      user.session('Juzer').get('disconnectedAt').getMinutes() - 3
    )
    var envId = user.session('Juzer').get('envId')
    // trying to resume the session after 3 minutes
    var newSocketId = 141241535354542324
    user.tryResume('Hablaba', newSocketId, function(err, username) {
      test.equal(err, 'Session doesn\'t exists!')
    })
    user.tryResume(envId, newSocketId, function(err, username) {
      test.equal(username, 'Juzer')
    })
    test.equal(user.session('Juzer').get('socketId'), newSocketId)
    user.session('Juzer').kill()
    test.done()
  })
}

exports['User Logout'] = function(test) {
  test.expect(4)

  test.equal(typeof user.logout, 'function')

  user.logout._sql_updateLastSeen = function(username, cb) {
    return cb(null, {affectedRows: 1})
  }

  var envId = '0a1b2c3d4e5f'
  var socketId = 123456789012345678
  user.login('Juzer', 'p4sSwrD', envId, socketId, function(err) {
    test.equal(err, null)
    user.logout(envId, function(err) {
      test.equal(err, null)
    })
    user.offlineFor('Juzer', function(seconds) {
      test.ok(seconds >= 0)
    })
    test.done()
  })
}

exports['User Register'] = function(test) {
  test.expect(15)

  test.equal(typeof user.register, 'function')
  test.equal(typeof user.register._sql_checkUsername, 'function')
  test.equal(typeof user.register._sql_register, 'function')

  user.register._sql_checkUsername = function(username, cb) {
    if (username == 'Fodi69') {
      cb(null, [{username: 'Fodi69'}])
    } else {
      cb(null, [])
    }
  }
  user.register._sql_register = function(username, password_type, password, email, cb) {
    cb(null, {insertId: 1234})
    /*
    if (username == 'Fodi69'
      && email == 'fodor0205@gmail.com'
      && password == 'p4sSwrD') {
        cb(null, [])
      } else {
        cb('Registration error')
      }*/
  }
  user.register('', 'test', 'test@test.hu', function(err) {
    test.equal(err, 'A felhasználónév megadása kötelező!')
  })
  user.register('test', '', 'test@test.hu', function(err) {
    test.equal(err, 'A jelszó megadása kötelező!')
  })
  user.register('test', 'test', '', function(err) {
    test.equal(err, 'Az e-mail cím megadása kötelező!')
  })
  user.register('t', 'test', 'test@test.hu', function(err) {
    test.equal(err, 'A felhasználónév hosszának 2 év 16 karakter között kell lennie!')
  })
  user.register('#ß÷%', 'test', 'test@test.hu', function(err) {
    test.equal(err, 'A felhasználónév csak a magyar ábécé betűít és számokat tartalmazhat!')
  })
  user.register('test', 'test', 'test@test.hu', function(err) {
    test.equal(err, 'A jelszó hossza legalább 8 karakter legyen!')
  })
  user.register('test', 'testtest', 'test@test.hu', function(err) {
    test.equal(err, 'A jelszónak legalább 1 számot kell tartalmaznia!')
  })
  user.register('test', 'testtest12', 'test@test', function(err) {
    test.equal(err, 'Hibás e-mail cím!')
  })
  user.register('test', 'testtest12', 'test.hu', function(err) {
    test.equal(err, 'Hibás e-mail cím!')
  })
  user.register('Fodi69', 'testtest12', 'test@test.hu', function(err) {
    test.equal(err, 'A felhasználónév már foglalt!')
  })
  user.register('test', 'testtest12', 'test@test.hu', function(err, userid) {
    test.equal(err, null)
    test.equal(userid, 1234)
  })
  test.done()
}
