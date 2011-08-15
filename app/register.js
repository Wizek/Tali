exports.register = function(username, password, email, cb) {
  cb = cb || function() {}
  if (!username) {
    return cb('A felhasználónév megadása kötelező!')
  }
  if (!password) {
    return cb('A jelszó megadása kötelező!')
  }
  if (!email) {
    return cb('Az e-mail cím megadása kötelező!')
  }
  if (username.length < 2 || username.length > 16) {
    return cb('A felhasználónév hosszának 2 év 16 karakter között kell lennie!')
  }
  if (!username.match(/^[A-zÖÜÓŐÚÉÁŰÍöüóőúéáűí0-9]{2,32}$/)) { // unsure
    return cb('A felhasználónév csak a magyar ábécé betűít és számokat tartalmazhat!')
  }
  if (password.length < 8) {
    return cb('A jelszó hossza legalább 8 karakter legyen!')
  }
  if (!password.match(/\d/)) {
    return cb('A jelszónak legalább 1 számot kell tartalmaznia!')
  }
  if (!email.match(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/)) {
    return cb('Hibás e-mail cím!')
  }
  that = this
  this.register._sql_checkUsername(username, function(err, result) {
    if (result.length > 0) {
      return cb('A felhasználónév már foglalt!')
    } else {
      that.register._sql_register(username, 'text', password, email
      , function(err, info) {
        return cb(err, info.insertId)
      })
    }
  })
}

exports.register._sql_checkUsername = function(username, cb) {
  db.query('SELECT username FROM tali_user WHERE username=?'
  , [username]
  , function(err, result) {
    return cb(err, result)
  })
}

exports.register._sql_register = function(username, password_type, password, email, cb) {
  db.query('INSERT INTO tali_user'
  + '(username,password_type,password,email,created_at,updated_at) VALUES'
  + '(?,?,?,?,now(),now())'
  , [username,password_type,password,email]
  , function(err, info) {
    return cb(err, info)
  })
}
