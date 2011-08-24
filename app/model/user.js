
/**
 * Module dependencies
 */
var log = require('log')
  //, db = require('db')
  //, crypto = require('crypto')

exports._sessionStore = []

/**
 * Session
 * @param search {object} String (for username) or any object
 * @return {object} with functions .init(), .get(), .set(), .kill()
 */
exports.session = function(search) {
  var foundUser = ''
  if (!search) {
    //log.error('Nem adtál meg session kulcsszót')
    return
  }
  if (typeof search == 'string') {
    if (!this._sessionStore[search]) {
      /*log.error('Nem található a hivatkozott session')
      log.debug('Searched username: ' + search)*/
    }
    foundUser = search
  } else if (search.username) {
    if (!this._sessionStore[search.username]) {
      /*log.error('Nem található a hivatkozott session')
      log.debug('Searched username: ' + search)*/
    }
    foundUser = search.username
  } else if (typeof search == 'object') {
    if (Object.keys(search).length != 1) {
      // log.error('Csak egyetlen paraméterre kereshetsz a sessionben')
      return
    }
    // Extract the first key
    var searchField = Object.keys(search).shift()

    for(var key in this._sessionStore) if (this._sessionStore.hasOwnProperty(key)) {
      if (this._sessionStore[key][searchField] == search[searchField]) {
        foundUser = key
      }
    }
    if (!foundUser) {
      log.error('Nem található a hivatkozott session')
      log.debug('Searched', search)
    }
  }
 
  var obj = {}
  var self = this
  obj.exists = this._sessionStore[foundUser] ? true : false
  obj.init = function() {
    this.exists = true
    self._sessionStore[foundUser] = {}
  }
  obj.get = function(key) {
    if (self._sessionStore[foundUser]) {
      if (key == 'username') {
        return foundUser
      } else if (self._sessionStore[foundUser][key]) {
        return self._sessionStore[foundUser][key]
      }
    }
  }
  obj.set = function(key, value) {
    if (!self._sessionStore[foundUser]) {
      this.init()
    }
    self._sessionStore[foundUser][key] = value
  }
  obj.kill = function() {
    if (self._sessionStore[foundUser]) {
      delete self._sessionStore[foundUser] // Kill it!
      this.exists = false
    }
  }
  return obj
}

/**
 * User login
 * @param username {String}
 * @param password {String} Password unhashed
 * @param envId {String}
 * @param socketId {Number}
 * @param cb {function} cb(err)
 */
exports.login = function (username, password, envId, socketId, cb) {
  cb = cb || function() {}
  if (typeof username != 'string')
    return cb('A felhasználónévnek egy Stringnek kell lennie!')
  
  if (typeof password != 'string')
    return cb('A jelszónak egy Stringnek kell lennie!')
  
  if (typeof envId != 'string')
    return cb('Az envId-nek Stringnek kell lennie!')
  
  if (typeof socketId != 'number')
    return cb('A socketId-nek Number-nek kell lennie!')
  
  // TODO hash
  /*var sid = crypto
    .createHash('sha1')
    .update(Math.random().toString())
    .digest('base64')*/
  
  var that = this
  this.login._sql_login(username, password, function(err, result) {
    if (!err) { // FIXME: use count()'s result instead!
      var mySession = that.session(username)
      if (mySession.get('envId') == envId) {
        return cb('Nem jelentkezhetsz be kétszer! Előbb jelentkezz ki!')
      }
      mySession.set('envId', envId)
      mySession.set('socketId', socketId)
      return cb()
    }else{
      return cb('Nem megfelelő felhasználónév és jelszó kombináció!')
    }
  })
}

exports.login._sql_login = function(username, password, cb) {
  db.query('SELECT count(username) FROM tali_user WHERE username=? AND password=?'
  , [username, password]
  , function(err, result) {
      return cb(err, result)
    }
  )
}

/**
 * User disconnect
 * @param socketId {String}
 * @param cb {function} cb(err)
 */
exports.disconnect = function(socketId, cb) {
  cb = cb || function() {}
  if (typeof socketId != 'number')
    return cb('A socketId-nek Number-nek kell lennie!')
  
  this.session({socketId: socketId}).set('disconnectedAt', new Date())
  return cb()
}

/**
 * How many seconds since the user is offline? -1 if still online
 * @param username {String}
 * @param cb {function} cb(err, offlineFor)
 */
exports.offlineFor = function(username, cb) {
  cb = cb || function() {}
  if (typeof username != 'string')
    return cb('A felhasználónévnek egy Stringnek kell lennie!')
  
  if (this.session(username).get('disconnectedAt')) {
    // How many seconds since the disconnecting
    offlineFor = Math.round(new Date().getTime() / 1000) -
      Math.round(this.session(username).get('disconnectedAt').getTime() / 1000)
    return cb(null, offlineFor)
  } else if (this.session(username).exists) {
    return cb(null, -1)
  } else {
    this.offlineFor._sql_getLastSeen(username, function(err, result) {
      if (err) {
        log.error(err)
        return cb(err)
      }
      // How many seconds since lastseen
      offlineFor = Math.round(new Date().getTime() / 1000) -
        Math.round(new Date(result.lastSeen).getTime() / 1000)
      return cb(null, offlineFor)
    })
  }
}

exports.offlineFor._sql_getLastSeen = function(username, cb) {
  db.query('SELECT last_seen FROM tali_user WHERE username=?'
    , [username]
    , function(err, result) {
        return cb(err, result)
      }
  )
}

/**
 * Try to resume to a session, which was started from this envId
 * @param envId {String}
 * @param newSocketId {Number} The current (new) socketId
 * @param cb {function} cb(err, username)
 */
exports.tryResume = function(envId, newSocketId, cb) {
  cb = cb || function() {}
  if (typeof envId != 'string')
    return cb('Az envId-nek Stringnek kell lennie!')
  
  if (typeof newSocketId != 'number')
    return cb('A socketId-nek Number-nek kell lennie!')
  
  var session = this.session({envId: envId})
  if (!session.exists) {
    return cb('Session doesn\'t exists!')
  }
  var username = session.get('username')
  if (!username) {
    return cb('Session doesn\'t have a username!')
  }
  this.offlineFor(username, function(err, offlineFor) {
    if (err) {
      return cb(err)
    }
    // security is my passion :D
    /*
    if (offlineFor > 600) {
      return cb('Session is over.')
    }*/
    if (offlineFor >= 0) {
      session.set('socketId', newSocketId)
      return cb(null, username)
    }
  })
}

/**
 * User logout
 * @param envId {String}
 * @param cb {function} cb(err)
 */
exports.logout = function(envId, cb) {
  cb = cb || function() {}
  if (typeof envId != 'string')
    return cb('Az envId-nek Stringnek kell lennie!')

  username = this.session({envId: envId}).get('username')
  var self = this
  this.logout._sql_updateLastSeen(username, function(err, result) {
    self.session(username).kill()
    return cb()
  })
}

exports.logout._sql_updateLastSeen = function(username, cb) {
  db.query('UPDATE tali_user SET lastSeen=now() WHERE username=?'
  , [username]
  , function(err, result) {
      return cb(err, result)
    }
  )
}

/**
 * User register
 * @param username {String}
 * @param password {String} Password unhashed
 * @param email {String}
 * @param cb {function} cb(err, insertId)
 */
exports.register = function(username, password, email, cb) {
  cb = cb || function() {}

  if (typeof username != 'string')
    return cb('A felhasználónévnek egy Stringnek kell lennie!')
  
  if (typeof password != 'string')
    return cb('A jelszónak egy Stringnek kell lennie!')
  
  if (typeof email != 'string')
    return cb('Az e-mail címnek egy Stringnek kell lennie!')
  
  if (username.length < 2 || username.length > 16)
    return cb('A felhasználónév hosszának 2 év 16 karakter között kell lennie!')
  
  if (!username.match(/^[A-zÖÜÓŐÚÉÁŰÍöüóőúéáűí0-9]{2,32}$/))
    return cb('A felhasználónév csak a magyar ábécé betűít és számokat tartalmazhat!')
  
  if (password.length < 8)
    return cb('A jelszó hossza legalább 8 karakter legyen!')
  
  if (!password.match(/\d/))
    return cb('A jelszónak legalább 1 számot kell tartalmaznia!')
  
  if (!email.match(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/))
    return cb('Hibás e-mail cím!')
  
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
