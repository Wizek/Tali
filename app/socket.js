
/**
 * Module dependencies
 */
var app = require('./expressServer')
  , io = require('socket.io').listen(app)
  , log = require('./log')
  , user = require('./model/user')
  , node = require('./model/node')
  , helpers = require('./helpers')

/**
 * Socket.IO basic configuration
 */
io.configure('production', function() {
  io.enable('browser client minification')
  io.enable('browser client etag')
  io.set('log level', 1)
})

io.set('log level', 0)

/**
 * Authorization before accepting a new connection to the editor namespace
 * Emits a 'connect_failed' event on client side, if the new connection
 * is refused by the server, or emits a 'connect' event on the client side,
 * if the new connection is accepted and ready
 */
/*io.of('/editor').authorization(function(handshakeData, cb) {
  cookies = helpers.cookiesToObject(handshakeData.headers.cookie)
  if(envId = cookies.eID) {
    user.isLoggedIn(envId, function(err, isLoggedIn) {
      if (err) {
        return cb()
      } else {
        if (isLoggedIn) {
          handshakeData.envId = envId
          return cb(null, true)
        }
        return cb()
      }
    })
  }
}).on('connection', function(socket) {

})*/




//})

io.sockets.on('connection', function (socket) {
  var fn = {}
  /**
   * Setting environment (browser) ID on the beginning of a connection
   * If this browser was already logged in, it returns true otherwise an error
   * @param envId {String} environment (browser) Id
   * @param cb {function} cb(err, isLoggedIn)
   */
  fn['set envId'] = function(envId, cb) {
    socket.set('envId', envId, function() {
      user.isLoggedIn(envId, function(err, isLoggedIn) {
        if (err) {
          return cb(err)
        } else {
          if (isLoggedIn) {
            for(var e in afterAuth) if (afterAuth.hasOwnProperty(e)) {
              socket.on(e, afterAuth[e])
            }
            user.resume(envId, socket.id, function(err, username, userId, onlineList, prevSocketId) {
              if (prevSocketId) {
                if (socket.namespace.sockets[prevSocketId]) {
                  socket.namespace.sockets[prevSocketId].disconnect()
                }
              }
              socket.set('username', username)
              socket.set('userId', userId)
              socket.broadcast.emit('user joined', username, userId)
            })
            return cb(null, true)
          } else {
            return cb('Not logged in yet')
          }
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
      user.login(username, password, envId, socket.id, function(err, userId, prevSocketId) {
        if (err) {
          return cb(err)
        } else {
          socket.set('username', username)
          socket.set('userId', userId)
          // todo
          for (var e in afterAuth) if (afterAuth.hasOwnProperty(e)) {
            socket.on(e, afterAuth[e])
          }
          return cb(err, userId)
        }
      })
    })
  }

  /**
   * User registration attempt
   * If the registration is successful, it returns the newly generated userId
   * otherwise a string with the error
   * @param username {String}
   * @param password {String}
   * @param email {String}
   * @param cb {function} cb(err, userId)
   */
  fn['register'] = function(username, password, email, cb) {
    user.register(username, password, email, cb)
  }

  /**
   * Bind the functions to the Socket.IO events
   */
  for (var e in fn) if (fn.hasOwnProperty(e)) {
    socket.on(e, fn[e])
  }


  var afterAuth = {}

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
   * Create a new node after a given node
   * If the aboveId is 0 or null, then the new node will be the first in the list,
   * if the aboveId is the Id of the last node, then the new node will be the last node
   * If the creation is successful, it broadcasts a 'new node' event, with the
   * parentId, nodeId, nodePosition and the username
   * @param parentId {Number}
   * @param aboveId {Number} id of the node above the new node
   * @param cb {function} cb(err, nodeId, nodePosition)
   */
  afterAuth['new node'] = function(parentId, aboveId, cb) {
    socket.get('username', function(err, username) {
      node.newNode(parentId, aboveId, function(err, nodeId, nodePosition) {
        socket.broadcast.emit('new node', parentId, nodeId, nodePosition, username)
        return cb(err, nodeId, nodePosition)
      })
    })
  }

  /**
   * Create a new node with a given position
   * If the creation is successful, it broadcasts a 'new node' event, with the
   * parentId, nodeId, nodePosition and the username
   * @param parentId {Number} Parent Id
   * @param position {Number} Position of the new node
   * @param cb {function} cb(err, nodeId)
   */
  afterAuth['new node by position'] = function(parentId, position, cb) {
    socket.get('username', function(err, username) {
      node.newNodeByPosition(parentId, position, function(err, nodeId) {
        socket.broadcast.emit('new node', parentId, nodeId, position, username)
        return cb(err, nodeId)
      })
    })
  }

  /**
   * Delete node from hierarchy
   * @param parentId {Number} Parent Id
   * @param childId {Number} Child Id
   * @param cb {function} cb(err)
   */
  afterAuth['delete node'] = function(parentId, childId, cb) {
    socket.get('username', function(err, username) {
      node.delete(parentId, childId, function(err) {
        socket.broadcast.emit('delete node', parentId, childId, username)
        return cb(err)
      })
    })
  }

  /**
   * Moving one nodes whole tree to other level with given new position
   * @param parentId {Number} Parent ID
   * @param childId {Number} Child ID
   * @param newParentId {Number} New parent ID
   * @param newPosition {Number} New position
   * @param cb {function} cb(err)
   */
  afterAuth['move whole tree'] = function(childId, newParentId, newPosition, cb) {
    socket.get('username', function(err, username) {
      node.moveWholeTree(childId, newParentId, newPosition, function(err) {
        socket.broadcast.emit('move whole tree', childId, newParentId, newPosition, username)
        return cb(err)
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
      socket.broadcast.emit('lock', nodeId, username)
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
      socket.broadcast.emit('unlock', username)
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

  // * shortcut
  afterAuth['edit headline of node'] = function(newText, nodeId, cb) {
    socket.get('userId', function(err, userId) {
      node.editHeadline(nodeId, newText, userId, cb)
      socket.get('username', function(err, username) {
        socket.broadcast.emit('change headline', nodeId, newText, username)
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

  /**
   * Current user is disconnecting
   * This function broadcasts a 'user left' event
   */
  afterAuth['disconnect'] = function() {
    socket.get('username', function(err, username) {
      socket.broadcast.emit('user left', username)
      user.disconnect(socket.id)
    })
  }


  /**
   * Current user is logging out
   * @param cb {function} cb(err)
   */
  afterAuth['logout'] = function(cb) {
    socket.get('envId', function(err, envId) {
      user.logout(envId, cb)
    })
  }

})
