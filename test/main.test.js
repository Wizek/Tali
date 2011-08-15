var main = require('../app/main.js')

exports['User Login'] = function (test) {
  test.expect(13)

  test.equal(typeof main.login, 'function')
  test.equal(typeof main.login._sql_login, 'function')

  main.login._sql_login = function(user, pass, sid, cb) {
    if (user == 'Juzer' && pass == 'p4sSwrD') {
      cb(null, []) // FIXME: use count()'s result instead!
    }else{
      cb('foobar')
    }
  }
  main.login('', 'Password', function(err, token) {
    test.equal(token, undefined)
    test.equal(err, 'Felhasználónév megadás kötelező!')
  })
  main.login('asdasd', '', function(err, token) {
    test.equal(token, undefined)
    test.equal(err, 'Jelszó megadás kötelező!')
  })
  main.login('Username', 'Password', function(err, token) {
    test.equal(token, undefined)
    test.equal(err, 'Nem megfelelő felhasználónév és jelszó kombináció!')
  })
  main.login('Juzer', 'p4sSwrD', function(err, token) {
    test.equal(err, null)
    test.ok(token)
    test.equal(token.length, 28)
  })
  main.login('Juzer', 'p4sSwrD', function(err, token) {
    test.equal(err, 'Nem jelentkezhetsz be kétszer! Előbb jelentkezz ki!')
    test.equal(token, undefined)
  })
  test.done()
}

exports['User Session Store'] = function(test) {
  user = main // mi a fenéért main

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
  user = main // mi a fenéért main

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
  user = main // mi a fenéért main
  
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
  user = main // mi a fenéért main
  
  test.expect(3)
  test.equal(typeof user.tryResume, 'function')
  user.login('Juzer', 'p4sSWrd', function() {
    user.disconnect('Juzer')
    user.session('Juzer').set('cookie','0a1b2c3d4e5f')
    user.session('Juzer').get('disconnectedAt').setMinutes(
      user.session('Juzer').get('disconnectedAt').getMinutes() - 3
    )
    var cookie = user.session('Juzer').get('cookie')
    // trying to resume the session after 3 minutes
    var newSocketId = 1412415353545423
    var resumeSuccessful = user.tryResume('Juzer', cookie, newSocketId)
    test.equal(resumeSuccessful, true)
    var resumeSuccessful = user.tryResume('Juzer', 'Hablaba', newSocketId)
    test.equal(resumeSuccessful, false)
    var resumeSuccessful = user.tryResume('asd', cookie, newSocketId)
    test.equal(resumeSuccessful, false)
    test.equal(user.session('Juzer').get('socketId'), newSocketId)
  })
  test.done()
}

exports['User Logout'] = function(test) {
  user = main // mi a fenéért main

  test.expect(3)
  test.equal(typeof user.logout, 'function')

  user.logout._sql_updateLastSeen = function(username, cb) {
    return cb(null, {affectedRows: 1})
  }

  main.logout('Juzer', function(err) {
    test.equal(err, null)
  })
  main.offlineFor('Juzer', function(seconds) {
    test.ok(seconds >= 0)
  })
  test.done()
}