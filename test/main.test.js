var main = require('../app/main.js')

exports['User Login'] = function (test) {
  test.expect(6)

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

eqports['User Session'] = function(test) {
  test.expect(0)  
  main.logout('Juzer', function(err) {
    test.equal('err')
  })
  main.offlineFor('Juzer', function(seconds) {
    test.equal(seconds, -1)
  })
  main.offlineFor('Juzer', function(seconds) {
    test.ok(seconds >= 0)
  })
  test.done()
}

eqports['User Logout'] = function(test) {
  test.expect(0)  
  main.logout('Juzer', function(err) {
    test.equal('err')
  })
  main.offlineFor('Juzer', function(seconds) {
    test.ok(seconds >= 0)
  })
  test.done()
}