
/**
 * Module dependencies
 */
var app = require('expressServer')
  , io = require('socket.io')
  , io = io.listen(app)
  , log = require('log')
  , user = require('user')
  , node = require('node')

io.sockets.on('connection', function (socket) {
  var fn = {}

  socket_bind = function(fn) {
    for(e in fn) if (fn.hasOwnProperty(e)) {
      socket.on(e, fn[e])
    }
  }

  var afterAuth = function() {
    socket_bind(afterAuth)
  }

  /**
   * afterAuth function init counter (the afterAuth functions can be inited only once per socket)
   */
  var counter = 0

  /**
   * Setting environment (browser) ID on the beginning of a connection
   * If this browser was already logged in, it broadcasts the join,
   * initializates the afterAuth functions
   * then it returns a username, a userId, and a list of online users,
   * otherwise an error.
   * @param envId {String} environment (browser) Id
   * @param cb {function} cb(err, username, userId, onlineList)
   */
  fn['set envId'] = function(envId, cb) {
    socket.set('envId', envId, function() {
      user.tryResume(envId, socket.id, function(err, username, userId, onlineList) {
        if (err) {
          return cb(err)
        } else {
          socket.set('username', username, function() {
            socket.set('userId', userId, function() {
              socket.broadcast.emit('user joined', username, user._onlineStore[username])
              counter++
              if (counter <= 1) {
                afterAuth()
              }
              return cb(err, username, userId, onlineList)
            })
          })
        }
      })
    })
  }

  /**
   * User login attempt with a username and a password
   * If the login is successful, it stores some info, broadcasts a
   * 'user joined' event, and initilializating the afterAuth functions,
   * then returns the userId to this username
   * @param username {String}
   * @param password {String} Password unhashed
   * @param cb {function} cb(err, userId)
   */
  fn['login'] = function(username, password, cb) {
    socket.get('envId', function(err, envId) {
      user.login(username, password, envId, socket.id, function(err, userId) {
        if (err) {
          return cb(err)
        } else {
          socket.broadcast.emit('user joined', username, user._onlineStore[username])
          socket.set('username', username)
          socket.set('userId', userId)
          counter++
          if (counter <= 1) {
            afterAuth()
          }
          return cb(err, userId)
        }
      })
    })
  }

  /**
   * Current socket is disconnecting
   * This function broadcasts a 'user left' event
   */
  fn['disconnect'] = function() {
    socket.get('username', function(err, username) {
      socket.broadcast.emit('user left', username)
      user.disconnect(socket.id)
    })
  }

  /**
   * The user is logging out
   * @param cb {function} cb(err)
   */
  fn['logout'] = function(cb) {
    socket.get('envId', function(err, envId) {
      user.logout(envId, cb)
    })
  }

  /**
   * User registration attempt
   * If the registration is successful, it returns the newly generated userId
   * @param username {String}
   * @param password {String}
   * @param email {String}
   * @param cb {function} cb(err, userId)
   */
  fn['register'] = function(username, password, email, cb) {
    user.register(username, password, email, cb)
  }

  /**
   * Set the focus to a node
   * @param nodeId {Number}
   * @param cb {function} cb(err)
   */
  afterAuth['set focus'] = function(nodeId, cb) {
    socket.get('username', function(err, username) {
      user.setFocus(nodeId, username, cb)
      socket.broadcast.emit('change focus', nodeId, username)
    })
  }

  /**
   * Gets the childrens of a node
   * @param nodeId {Number}
   * @param cb {function} cb(err, results)
   */
  afterAuth['get children of'] = function(nodeId, cb) {
    node.getLevel(nodeId, cb)
  }

  /**
   * Makes a new node
   * If the aboveId is 0 or null, then the new node will be the first in the list,
   * if the aboveId is the Id of the last node, then the new node will be the last node
   * If the make is successful, it broadcasts a 'new node' event, with the
   * parentId, nodeId, nodePosition and the username
   * @param parentId {Number}
   * @param aboveId {Number} id of the node above the new node
   * @param cb {function} cb(err, nodeId, nodePosition)
   */
  afterAuth['new node'] = function(parentId, aboveId, cb) {
    socket.get('userId', function(err, userId) {
      socket.get('username', function(err, username) {
        node.newNode(parentId, aboveId, userId, function(err, nodeId, nodePosition) {
          socket.broadcast.emit('new node', parentId, nodeId, nodePosition, username)
          return cb(err, nodeId, nodePosition)
        })
      })
    })
  }

  /**
   * Locks a node for editing
   * @param nodeId {Number}
   * @param cb {function} cb(err)
   */
  afterAuth['lock'] = function(nodeId, cb) {
    socket.set('lock', nodeId)
    socket.get('username', function(err, username) {
      user.lock(nodeId, username, cb)
      socket.broadcast.emit('change lock', nodeId, username)
    })
  }

  /**
   * Unlocks the currently locked node
   * @param cb {function} cb(err)
   */
  afterAuth['unlock'] = function(cb) {
    socket.set('lock', null)
    socket.get('username', function(err, username) {
      user.unlock(username, cb)
    })
  }

  /**
   * Edits the headline of the currently focused node
   * @param newText {String} The new content
   * @param cb {function} cb(err)
   */
  afterAuth['edit headline'] = function(newText, cb) {
    socket.get('userId', function(err, userId) {
      socket.get('lock', function(err, lockId) {
        node.editHeadline(lockId, newText, userId, cb)
        socket.get('username', function(err, username) {
          socket.broadcast.emit('change headline', lockId, newText, username)
        })
      })
    })
  }

  /**
   * Edits the body of the currently focused node
   * @param newText {String} The new content
   * @param cb {function} cb(err)
   */
  afterAuth['edit body'] = function(newText, cb) {
    socket.get('userId', function(err, userId) {
      socket.get('lock', function(err, lockId) {
        node.editBody(lockId, newText, userId, cb)
        socket.get('username', function(err, username) {
          socket.broadcast.emit('change body', lockId, newText, username)
        })
      })
    })
  }

  socket_bind(fn)
})
