
/**
 * Module dependencies
 */
var log = require('../log')
  , db = require('../db')
  //, crypto = require('crypto')

/**
 * Storing online (logged in) users
 */
exports._onlineStore = {}

/**
 * Storing the session between two socket.io connections
 * for an environment specified by envId
 */
exports._sessionStore = {}

/**
 * Get a row from the session store by a searchterm
 * @param search {object} String (envId) or any object with one term
 * @return {object} with functions .get(), .set(), .kill()
 */
exports.session = function(search) {
  if (!search) {
    log.error('SESSION: No searchterm was given')
    return
  }
  if (typeof search != 'string' && typeof search != 'object') {
    log.error('SESSION: Searchterm must be a String or an Object')
    return
  }
  // Quick search just by defining the envId as a string
  if (typeof search == 'string') {
    search = {
      envId: search
    }
  }
  // This will be later the key of the found session
  var foundSessionKey = ''
  if (search.envId) {
    if (!this._sessionStore[search.envId]) {
      this._sessionStore[search.envId] = {}
    }
    foundSessionKey = search.envId
  } else {
    if (Object.keys(search).length != 1) {
      log.error('SESSION: Searchterm can contain only 1 term')
      return
    }
    // Extract the first key
    var searchField = Object.keys(search).shift()

    for(var key in this._sessionStore) if (this._sessionStore.hasOwnProperty(key)) {
      if (this._sessionStore[key][searchField] == search[searchField]) {
        foundSessionKey = key
      }
    }
    if (!foundSessionKey) {
      return false
    }
  }
 
  var self = this
  // Creating the return object
  var obj = {}
  obj.get = function(key) {
    if (self._sessionStore[foundSessionKey]) {
      if (key == 'envId') {
        return foundSessionKey
      } else if (self._sessionStore[foundSessionKey][key]) {
        return self._sessionStore[foundSessionKey][key]
      }
    }
    return undefined
  }
  obj.set = function(key, value) {
    self._sessionStore[foundSessionKey][key] = value
    return obj
  }
  obj.kill = function() {
    if (self._sessionStore[foundSessionKey]) {
      delete self._sessionStore[foundSessionKey] // Kill it!
    }
  }
  return obj
}

/**
 * User login attempt with username and password
 * @param username {String}
 * @param password {String} Password unhashed
 * @param envId {String}
 * @param socketId {String}
 * @param cb {function} cb(err, userId)
 */
exports.login = function (username, password, envId, socketId, cb) {
  cb = cb || function() {}

  if (typeof cb != 'function')
    return

  if (typeof username != 'string')
    return cb('Username must be a String')
  
  if (typeof password != 'string')
    return cb('Password must be a String')
  
  if (typeof envId != 'string')
    return cb('EnvId must be a String')
  
  if (parseInt(socketId) != socketId)
    return cb('SocketId must be a Number')
  
  // TODO hash
  /*var sid = crypto
    .createHash('sha1')
    .update(Math.random().toString())
    .digest('base64')*/
  
  var self = this
  this.login._sql_login(username, password, function(err, result) {
    if (err) {
      log.error(err)
      return cb('Database error')
    }
    if (parseInt(result[0].count) > 0) {
      if (otherSession = self.session({username: username})) {
        if (otherSession.get('envId') != envId) {
          // TODO we must disconnect the other user
          otherSession.kill()
        }
      }
      var mySession = self.session(envId)
      if (mySession.get('username')) {
        return cb('You can not login twice')
      }
      var userId = result[0].id
      mySession.set('username', username)
      mySession.set('socketId', socketId)
      mySession.set('userId', userId)
      self._onlineStore[username] = {
        userId: userId
      , focus: null
      , lock: null
      }
      return cb(null, userId)
    } else {
      return cb('Wrong username and password combination')
    }
  })
}

exports.login._sql_login = function(username, password, cb) {
  db.query('SELECT count(username) AS count, id FROM tali_user WHERE username=? AND password=?'
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

  if (typeof cb != 'function')
    return

  if (parseInt(socketId) != socketId)
    return cb('SocketId must be a Number')
  
  var mySession = this.session({socketId: socketId})
  mySession.set('disconnectedAt', new Date())
  var username = mySession.get('username')
  delete this._onlineStore[username]

  return cb()
}

/**
 * How many seconds since the user is offline? -1 if still online
 * @param username {String}
 * @param cb {function} cb(err, offlineFor)
 */
exports.offlineFor = function(username, cb) {
  cb = cb || function() {}

  if (typeof cb != 'function')
    return

  if (typeof username != 'string')
    return cb('Username must be a String')
  
  if (this.session({username: username}).get('disconnectedAt')) {
    // How many seconds since the disconnecting
    offlineFor = Math.round(new Date().getTime() / 1000) -
      Math.round(this.session({username: username}).get('disconnectedAt').getTime() / 1000)
    return cb(null, offlineFor)
  } else if (this.session({username: username})) {
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
 * Check if the user is logged in on this environment or not
 * @param envId {String}
 * @param cb {function} cb(err, isLoggedIn)
 */
exports.isLoggedIn = function(envId, cb) {
  cb = cb || function() {}

  if (typeof cb != 'function')
    return

  if (typeof envId != 'string')
    return cb('EnvId must be a String')

  var session = this.session(envId)
  if (session.get('username')) {
    return cb(null, true)
  } else {
    return cb('You were not logged in at this environment')
  }
}
/**
 * Resume to a session which was started from this envId,
 * after the connection is alive
 * @param envId {String}
 * @param newSocketId {String} The current (new) socketId
 * @param cb {function} cb(err, username, userId, onlineList)
 */
exports.resume = function(envId, newSocketId, cb) {
  cb = cb || function() {}

  if (typeof cb != 'function')
    return

  if (typeof envId != 'string')
    return cb('EnvId must be a String')
  
  if (parseInt(newSocketId) != newSocketId)
    return cb('NewSocketId must be a Number')
  
  var session = this.session(envId)
  if (!session.get('username')) {
    return cb('You were not logged in at this environment')
  }
  var username = session.get('username')
    , userId   = session.get('userId')
  session.set('socketId', newSocketId)
  this._onlineStore[username] = {
    userId: userId
  , focus: null
  , lock: null
  }
  return cb(null, username, userId, this._onlineStore)
}

/**
 * User logout
 * @param envId {String}
 * @param cb {function} cb(err)
 */
exports.logout = function(envId, cb) {
  cb = cb || function() {}

  if (typeof cb != 'function')
    return

  if (typeof envId != 'string')
    return cb('EnvId must be a String')

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
 * Focus on node
 * @param nodeId {Number} Node id to focus on
 * @param username {String} Focuser
 * @param cb {function} cb(err)
 */

exports.setFocus = function(nodeId, username, cb) {
  cb = cb || function() {}

  if (typeof cb != 'function')
    return

  if (parseInt(nodeId) != nodeId)
    return cb('NodeId must be a Number')

  if (typeof username != 'string')
    return cb('Username must be a String')

  this._onlineStore[username]['focus'] = nodeId
  return cb()
}

/**
 * Lock node
 * @param id {Number} Node id to lock
 * @param username {String} Locker
 * @param cb {function} cb(err)
 */
exports.lock = function(nodeId, username, cb) {
  cb = cb || function() {}

  if (typeof cb != 'function')
    return

  if (parseInt(nodeId) != nodeId)
    return cb('NodeId must be a Number')

  if (typeof username != 'string')
    return cb('Username must be a String')

  for (key in this._onlineStore) if (this._onlineStore.hasOwnProperty(key)) {
    if (this._onlineStore[key]['lock'] == nodeId) {
      return cb('Node already locked by ' + key)
      break
    }
  }
  this._onlineStore[username]['lock'] = nodeId
  return cb()
}

/**
 * Unlock all nodes for a user
 * @param username {String}
 * @param cb {function} cb(err)
 */
exports.unlock = function(username, cb) {
  cb = cb || function() {}

  if (typeof cb != 'function')
    return

  if (typeof username != 'string')
    return cb('Username must be a String')

  this._onlineStore[username]['lock'] = null
  return cb()
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

  if (typeof cb != 'function')
    return

  if (typeof username != 'string')
    return cb('Username must be a String')
  
  if (typeof password != 'string')
    return cb('Password must be a String')
  
  if (typeof email != 'string')
    return cb('Email must be a String')
  
  if (username.length < 2 || username.length > 16)
    return cb('Username length must be within 2 and 16 character')
  
  if (!username.match(/^[A-zÖÜÓŐÚÉÁŰÍöüóőúéáűí0-9]{2,32}$/))
    return cb('Username can only contain characters from the hungarian alphabet and numbers')
  
  if (password.length < 8)
    return cb('Password length must be at least 8 character')
  
  if (!password.match(/\d/))
    return cb('Password must contain at least 1 number')
  
  if (!email.match(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/))
    return cb('Wrong email address')
  
  that = this
  this.register._sql_checkUsername(username, function(err, result) {
    if (result.length > 0) {
      return cb('This username is already taken')
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
