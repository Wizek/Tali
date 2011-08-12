var crypto = require('crypto')

exports.login = function (username, password, cb) {
  if (!username) {
    return cb('Felhasználónév megadás kötelező!')
  }
  if (!password) {
    return cb('Jelszó megadás kötelező!')
  }
  var sid = crypto
    .createHash('sha1')
    .update(Math.random().toString())
    .digest('base64')
  this.login._sql_login(username, password, sid, function(err, result) {
    if (!err) { // FIXME: use count()'s result instead!
      cb(null, sid)
    }else{
      cb('Nem megfelelő felhasználónév és jelszó kombináció!')
    }
  })
}
exports.login._sql_login = function(username, password, cb) {
  db.query('SELECT count(username) FROM tali_user WHERE username=? AND password=?'
  , [username, password]
  , function(err, result) {
    cb(err, result) // FIXME: use count()'s result instead!
  })
}