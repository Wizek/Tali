var user = require('../app/register')

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
