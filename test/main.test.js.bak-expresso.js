var should = require('should')
  , assert = require('assert')
  , main = require('../app/main.js')

exports['User login logic'] = function (beforeExit) {
  var cFn = 0
  main.should.respondTo('login')
  main.login.should.respondTo('_sql_login')
  main.login._sql_login = function(user, pass, cb) {
    if (user == 'Juzer' && pass == 'p4sSwrD') {
      cb(null, [])
    }else{
      cb('foobar')
    }
  }
  main.login('Username', 'Password', function(err, ok) {
    should.not.exist(ok)
    err.should.eql('Nem megfelelő felhasználónév és jelszó kombináció!')
    ++cFn
  })
  main.login('', 'Password', function(err, ok) {
    should.not.exist(ok)
    err.should.eql('Felhasználónév megadás kötelező!')
    ++cFn
  })
  main.login('asdasd', '', function(err, ok) {
    should.not.exist(ok)
    err.should.eql('Jelszó megadás kötelező!')
    ++cFn
  })
  main.login('Juzer', 'p4sSwrD', function(err, ok) {
    assert.equal(ok, true)
    assert.equal
    should.not.exist(err)
    ok.should.eql(ok)
    ++cFn
  })
  beforeExit(function() {
    cfn.should.eql(4)
  })
}