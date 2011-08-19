var crypto = require('crypto')
  , paths = require('../paths')
  , log = require('log')

exports._sessionStore = []
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

exports.login = function (username, password, envId, socketId, cb) {
  if (!username) {
    return cb('Felhasználónév megadás kötelező!')
  }
  if (!password) {
    return cb('Jelszó megadás kötelező!')
  }
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

exports.disconnect = function(username, cb) {
  cb = cb || function() {}
  this.session(username).set('disconnectedAt', new Date())
  return cb()
}

exports.offlineFor = function(username, cb) {
  cb = cb || function() {}
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

exports.tryResume = function(envId, newSocketId, cb) {
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

exports.logout = function(envId, cb) {
  cb = cb || function() {}

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
