
/**
 * Module dependencies
 */
var log = require('log')
  , db = require('db')
  , helpers = require('helpers')

/**
 * Global variable
 */
var NODE_MAX_POSITION = 8388607

/**
 * Get node level
 * @param parentId {Number} parent ID
 * @param cb {function} cb(err, data)
 */
exports.getLevel = function(parentId, cb) {
  cb = cb || function() {}

  if (typeof cb != 'function')
    return

  if (parseInt(parentId) != parentId)
    return cb('ParentId must be a Number')

  this.getLevel._sql_getLevel(parentId, function(err, results) {
    if (err) {
      log.error(err)
      return cb('Database error')
    } else {
      return cb(null, results)
    }
  })
}

exports.getLevel._sql_getLevel = function(parentId, cb) {
  db.query('SELECT tali_node.*, hierarchy.parent_id,'
        +' (SELECT count(child_id) FROM tali_node_hierarchy WHERE parent_id=tali_node.id) AS childnum'
        +' FROM tali_node'
        +' LEFT JOIN tali_node_hierarchy hierarchy ON hierarchy.child_id=tali_node.id'
        +' WHERE hierarchy.parent_id=?'
        +' ORDER BY hierarchy.position'
  , [parentId]
  , function(err, results) {
      return cb(err, results)
    }
  )
}

/**
 * Make new node
 * @param parentId {Number} parent ID
 * @param aboveId {Number} ID of the node above the new node
 * @param userId {Number} Creator
 * @param cb {function} cb(err, nodeId)
 */
exports.newNode = function(parentId, aboveId, userId, cb) {
  cb = cb || function() {}

  if (typeof cb != 'function')
    return

  if (parseInt(parentId) != parentId)
    return cb('ParentId must be a Number')

  if (parseInt(aboveId) != aboveId)
    return cb('AboveId must be a Number')

  if (parseInt(userId) != userId)
    return cb('UserId must be a Number')

  var abovePosition = 0
  var nextPosition = 0
  var that = this
  var cbAfterPosition = function(abovePosition) {
    that._sql_selectNextPosition(parentId, abovePosition, function(err, result) {
      if (Object.keys(result[0]).length == 0) {
        nextPosition = NODE_MAX_POSITION
      } else {
        nextPosition = result[0].position
      }
      var newPosition = Math.round(abovePosition + (nextPosition - abovePosition) / 2)
      that.newNode._sql_createEmptyNode(function(err, result) {
        var newId = result.insertId
        that.newNode._sql_saveHierarchy(parentId, newId, newPosition, function(err, info) {
          return cb(err, newId, newPosition)
        })
      })
    })
  }
  if (aboveId == 0 || aboveId == null) {
    cbAfterPosition(0)
  } else {
    this._sql_selectPosition(parentId, aboveId, function(err, result) {
      cbAfterPosition(result[0].position)
    })
  }
}

exports._sql_selectPosition = function(parentId, aboveId, cb) {
  db.query('SELECT position FROM tali_node_hierarchy'
  + ' WHERE parent_id=? AND child_id=?'
  , [parentId, aboveId]
  , function(err, result) {
      return cb(err, result)
    }
  )
}

exports._sql_selectNextPosition = function(parentId, abovePosition, cb) {
  db.query('SELECT position FROM tali_node_hierarchy'
  + ' WHERE parent_id=? AND position>?'
  + ' ORDER BY position ASC LIMIT 1'
  , [parentId, abovePosition]
  , function(err, result) {
      return cb(err, result)
    }
  )
}

exports.newNode._sql_createEmptyNode = function(cb) {
  db.query('INSERT INTO tali_node(updated_at, created_at)'
  + ' VALUES (now(), now())'
  , function(err, info) {
      return cb(err, info)
    }
  )
}

exports.newNode._sql_saveHierarchy = function(parentId, childId, position, cb) {
  db.query('INSERT INTO tali_node_hierarchy(parent_id, child_id, position)'
  + ' VALUES (?, ?, ?)'
  , [parentId, childId, position]
  , function(err, info) {
      return cb(err, info)
    }
  )
}

/**
 * Moving one or more nodes to an other location
 * @param parentId {Number} Current parent of the moved nodes
 * @param nodes {Array} Array of node IDs
 * @param newParentId {Number} The new parent ID
 * @param aboveId {Number} The ID of the node above the new location
 * @param atomic {Boolean} If it's an atomic relocation, or tree-style relocation (with childs)
 * @param cb {function} cb(err, newPositions)
 */

exports.move = function(parentId, nodes, newParentId, aboveId, atomic, cb) {
  cb = cb || function() {}

  if (typeof cb != 'function')
    return

  if (parseInt(parentId) != parentId)
    return cb('ParentId must be a Number')

  if (!Array.isArray(nodes))
    return cb('Nodes must be an Array')

  if (parseInt(newParentId) != newParentId)
    return cb('NewParentId must be a Number')

  if (parseInt(aboveId) != aboveId)
    return cb('AboveId must be a Number')

  if (typeof atomic != 'boolean')
    return cb('Atomic must be a Boolean')

  var that = this

  var newPositions = {}
  var setNodePositions = function(abovePosition, interval, cb) {
    var currentPosition = abovePosition
    // Only run the provided callback, when forCb() has been called 'nodes.length' times
    var forCb = new helpers.asyncCbChecker(nodes.length, function(err) {
      if (err) {
        log.error(err)
        return cb(err)
      } else {
        if (atomic) {
          //moveChildsUp(nodes, cb)
        } else {
          return cb(null, newPositions)
        }
      }
    })
    for (var i = 0, len = nodes.length; i < len; i++) {
      currentPosition+= interval
      newPosition = Math.round(currentPosition)
      newPositions[nodes[i]] = newPosition
      that.move._sql_setPosition(parentId, nodes[i], newPosition, forCb)
    }
  }

  /*var moveChildsUp = function(childs, newParent, cb) {
    for (var i = 0, len = childs.length; i < len; i++) {
      that.getLevel(childs[i], function(err, data) {
        var childs = []
        for (var j = 0, len1 = data.length; j < len1; j++) {
          childs.push(data[j].id)
        }
        that.move._sql_setParents(childs, newParent, function(err, info) {
          cb(err)
        })
      })
    }
  }*/

  var cbAfterPosition = function(abovePosition) {
    that._sql_selectNextPosition(parentId, abovePosition, function(err, result) {
      if (err) {
        log.error(err)
        return cb('Database error')
      } else {
        var nextPosition = 0
        if (Object.keys(result[0]).length == 0) {
          nextPosition = NODE_MAX_POSITION
        } else {
          nextPosition = result[0].position
        }
        var interval = (nextPosition - abovePosition) / (nodes.length + 1)
        if (interval < 1) {
          // MUST REFRACTOR ALL POSITIONS IN THIS LEVEL
        }
        that.move._sql_setParents(parentId, nodes, newParentId, function(err, info) {
          if (err) {
            log.error(err)
            return cb('Database error')
          } else {
            if (info.affectedRows != nodes.length) {
              log.error('Update affected more or less rows than it should', info, nodes)
              return cb('Database error')
            } else {
              setNodePositions(abovePosition, interval, cb)
            }
          }
        })
      }
    })
  }

  if (aboveId == 0 || aboveId == null) {
    cbAfterPosition(0)
  } else {
    that._sql_selectPosition(parentId, aboveId, function(err, result) {
      if (err) {
        log.error(err)
        return cb('Database error')
      } else {
        cbAfterPosition(result[0].position)
      }
    })
  }
}

exports.move._sql_setParents = function(parentId, nodes, newParentId, cb) {
  db.query('UPDATE tali_node_hierarchy SET parent_id=?'
  + ' WHERE child_id IN (' + nodes.join(',') + ')'
  + ' AND parent_id=?'
  , [newParentId, parentId]
  , function(err, info) {
      return cb(err, info)
    }
  )
}

exports.move._sql_setPosition = function(parentId, childId, newPosition, cb) {
  db.query('UPDATE tali_node_hierarchy SET position=?'
  + ' WHERE parent_id=? AND child_id=?'
  , [newPosition, parentId, childId]
  , function(err, info) {
      return cb(err, info)
    }
  )
}

/**
 * Edit headline
 * @param id {Number} Node id
 * @param newText {String}
 * @param userId {Number} Editor
 * @param cb {function} cb(err)
 */
exports.editHeadline = function(id, newText, userId, cb) {
  cb = cb || function() {}

  if (typeof cb != 'function')
    return

  if (parseInt(id) != id)
    return cb('NodeId must be a Number')

  if (typeof newText != 'string')
    return cb('NewText must be a String')

  if (parseInt(userId) != userId)
    return cb('UserId must be a Number')

  this.editHeadline._sql_save(id, newText, function(err, result) {
    if (err) {
      log.error(err)
      return cb('Database error')
    } else {
      if (result.affectedRows != 1) {
        return cb('Node not found')
      }
      return cb()
    }
  })
}

exports.editHeadline._sql_save = function(id, newText, cb) {
  db.query('UPDATE tali_node SET headline=? WHERE id=?'
  , [newText, id]
  , function(err, result) {
      return cb(err, result)
    }
  )
}

/**
 * Edit body
 * @param id {Number} Node id
 * @param newText {String}
 * @param userId {Number} Editor
 * @param cb {function} cb(err)
 */
exports.editBody = function(id, newText, userId, cb) {
  cb = cb || function() {}

  if (parseInt(id) != id)
    return cb('NodeId must be a Number')

  if (typeof newText != 'string')
    return cb('NewText must be a String')

  if (parseInt(userId) != userId)
    return cb('UserId must be a Number')

  this.editBody._sql_save(id, newText, function(err, result) {
    if (err) {
      log.error(err)
      return cb('Database error')
    } else {
      if (result.affectedRows != 1) {
        return cb('Node not found')
      }
      return cb()
    }
  })
}

exports.editBody._sql_save = function(id, newText, cb) {
  db.query('UPDATE tali_node SET body=? WHERE id=?'
  , [newText, id]
  , function(err, result) {
      return cb(err, result)
    }
  )
}
