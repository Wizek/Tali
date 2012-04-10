
/**
 * Module dependencies
 */
var log = require('../log')
  , db = require('../db')
  , helpers = require('../helpers')

/**
 * Constant for the maximum position
 */
exports.MAX_POSITION = Math.pow(2,32)-1

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
  db.query(''
    +' SELECT `tali_node`.*, `hierarchy`.`parent_id`, `hierarchy`.`position`, '
    +'   ( '
    +'     SELECT count(child_id) '
    +'     FROM tali_node_hierarchy'
    +'     WHERE parent_id=tali_node.id'
    +'   ) AS childnum'
    +' FROM tali_node'
    +' LEFT JOIN tali_node_hierarchy hierarchy ON hierarchy.child_id=tali_node.id'
    +' WHERE hierarchy.parent_id=?'
  , [parentId]
  , cb
  )
}

/**
 * Get position of a node
 * Returns 0 if the childId is 0
 * @param parentId {Number} parent ID
 * @param childId {Number} node ID
 * @param cb {function} cb(err, position)
 */
exports._getPosition = function(parentId, childId, cb) {
  cb = cb || function() {}

  if (typeof cb != 'function')
    return

  if (childId == 0 || childId == null) {
    return cb(null, 0)
  } else {
    this._sql_selectPosition(parentId, childId, function(err, result) {
      if (err) {
        log.error(err)
        return cb('Database error')
      } else {
        if (result.length == 0 || !result[0].hasOwnProperty('position')) {
          log.error('Failed to get position of node ' + childId + ' - parent ' + parentId)
          return cb('Node not exists')
        } else {
          return cb(null, result[0].position)
        }
      }
    })
  }
}

exports._sql_selectPosition = function(parentId, childId, cb) {
  db.query('SELECT position FROM tali_node_hierarchy'
  + ' WHERE parent_id=? AND child_id=?'
  , [parentId, childId]
  , function(err, result) {
      return cb(err, result)
    }
  )
}

/**
 * Get position above a given position
 * Returns 0 if there is nothing before the given position
 * @param parentId {Number} parent ID
 * @param nextPosition {Number} position
 * @param cb {function} cb(err, abovePosition)
 */
exports._getAbovePosition = function(parentId, nextPosition, cb) {
  cb = cb || function() {}

  if (typeof cb != 'function')
    return

  this._sql_selectAbovePosition(parentId, nextPosition, function(err, result) {
    if (err) {
      log.error(err)
      return cb('Database error')
    } else {
      var abovePosition = 0
      if (Object.keys(result[0]).length != 0) {
        abovePosition = result[0].position
      }
    }
    return cb(null, abovePosition)
  })
}

exports._sql_selectAbovePosition = function(parentId, nextPosition, cb) {
  db.query('SELECT position FROM tali_node_hierarchy'
  + ' WHERE parent_id=? AND position<?'
  + ' ORDER BY position DESC LIMIT 1'
  , [parentId, nextPosition]
  , function(err, result) {
      return cb(err, result)
    }
  )
}
/**
 * Get the next position after a given position
 * Returns MAX_POSITION if there is nothing after the given position
 * @param parentId {Number} parent ID
 * @param abovePosition {Number} position above
 * @param cb {function} cb(err, nextPosition)
 */
exports._getNextPosition = function(parentId, abovePosition, cb) {
  var _self = this
  this._sql_selectNextPosition(parentId, abovePosition, function(err, result) {
    if (err) {
      log.error(err)
      return cb('Database error')
    } else {
      var nextPosition = 0
      if (Object.keys(result[0]).length == 0) {
        nextPosition = _self.MAX_POSITION
      } else {
        nextPosition = result[0].position
      }
      return cb(null, nextPosition)
    }
  })
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

exports._sql_createHierarchy = function(parentId, childId, position, cb) {
  db.query('INSERT INTO tali_node_hierarchy(parent_id, child_id, position)'
  + ' VALUES (?, ?, ?)'
  , [parentId, childId, position]
  , function(err, info) {
      return cb(err, info)
    }
  )
}

/**
 * Create a new node after a given node
 * @param parentId {Number} parent ID
 * @param aboveId {Number} ID of the node above the new node
 * @param cb {function} cb(err, nodeId, newPosition)
 */
exports.newNode = function(parentId, aboveId, cb) {
  cb = cb || function() {}

  if (typeof cb != 'function')
    return

  if (parseInt(parentId) != parentId)
    return cb('ParentId must be a Number')

  if (parseInt(aboveId) != aboveId)
    return cb('AboveId must be a Number')

  var _self = this
  this._getPosition(parentId, aboveId, function(err, abovePosition) {
    _self._getNextPosition(parentId, abovePosition, function(err, nextPosition) {
      var newPosition = Math.round(abovePosition + (nextPosition - abovePosition) / 2)
      _self.newNode._sql_createEmptyNode(function(err, info) {
        var newChildId = info.insertId
        _self._sql_createHierarchy(parentId, newChildId, newPosition, function(err) {
          if (err) {
            log.error(err)
            return cb('Database error')
          } else {
            return cb(null, newChildId, newPosition)
          }
        })
      })
    })
  })
}

/**
 * Create a new node with a given position
 * @param parentId {Number} Parent Id
 * @param position {Number} Position of the new node
 * @param cb {function} cb(err, nodeId)
 */
exports.newNodeByPosition = function(parentId, position, cb) {
  cb = cb || function() {}

  if (typeof cb != 'function')
    return

  if (parseInt(parentId) != parentId)
    return cb('ParentId must be a Number')

  if (parseInt(position) != position)
    return cb('Position must be a Number')

  var _self = this
  _self.newNode._sql_createEmptyNode(function(err, info) {
    var newChildId = info.insertId
    _self._sql_createHierarchy(parentId, newChildId, position, function(err) {
      if (err) {
        log.error(err)
        return cb('Database error')
      } else {
        return cb(null, newChildId)
      }
    })
  })
}

exports.newNode._sql_createEmptyNode = function(cb) {
  db.query('INSERT INTO tali_node(updated_at, created_at)'
  + ' VALUES (now(), now())'
  , cb)
}

/**
 * Delete node from hierarchy
 * @param parentId {Number} Parent Id
 * @param childId {Number} Child Id
 * @param cb {function} cb(err)
 */
exports.delete = function(parentId, childId, cb) {
  cb = cb || function() {}

  if (typeof cb != 'function')
    return

  if (parseInt(parentId) != parentId)
    return cb('ParentId must be a Number')

  if (parseInt(childId) != childId)
    return cb('ChildId must be a Number')

  this.delete._sql_deleteNode(parentId, childId, function(err) {
    if (err) {
      log.error(err)
      return cb('Database error')
    }
    return cb()
  })
}

exports.delete._sql_deleteNode = function(parentId, childId, cb) {
  db.query('DELETE FROM tali_node_hierarchy WHERE'
    //+ ' parent_id=? AND'
    + ' child_id=?'
  , [/*parentId,*/ childId]
  , cb)
}

/**
 * Moving one nodes whole tree to other level with given new position
 * @param parentId {Number} Parent ID
 * @param childId {Number} Child ID
 * @param newParentId {Number} New parent ID
 * @param newPosition {Number} New position
 * @param cb {function} cb(err)
 */
 exports.moveWholeTree = function(childId, newParentId, newPosition, cb) {
  cb = cb || function() {}

  if (typeof cb != 'function')
    return

  /*if (parseInt(parentId) != parentId)
    return cb('ParentId must be a Number')*/

  if (parseInt(childId) != childId)
    return cb('ChildId must be a Number')

  if (parseInt(newParentId) != newParentId)
    return cb('NewParentId must be a Number')

  if (parseInt(newPosition) != newPosition)
    return cb('NewPosition must be a Number')

  this.moveWholeTree._sql_updateHierarchy(childId, newParentId, newPosition, function(err) {
    if (err) {
      log.error(err)
      return cb('Database error 6562')
    }
    return cb()
  })
}

this.moveWholeTree._sql_updateHierarchy = function(childId, newParentId, newPosition, cb) {
  db.query('UPDATE tali_node_hierarchy SET'
    + ' parent_id=?,'
    + ' position=?'
    + ' WHERE child_id=?'
  , [newParentId, newPosition, childId]
  , cb)
}

/**
 * Moving one or more nodes to an other location
 * @param parentId {Number} Current parent of the moved nodes
 * @param nodes {Array} Array of node IDs
 * @param newParentId {Number} The new parent ID
 * @param aboveId {Number} ID of the node above the new location
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

  var self = this

  var moveChildsUp = function(nodes, newParent, cb) {
    var forCb = new helpers.asyncCbChecker(nodes.length, function(err, childsArray) {
      childIds = []
      for (var i = 0, len = childsArray.length; i < len; i++) {
        childIds = childIds.concat(childsArray[i])
      }
      cb(err, childIds)
    })
    for (var i = 0, len = nodes.length; i < len; i++) {
      self.getLevel(nodes[i], function(err, childs) {
        self.move._sql_updateParents(nodes[i], childs, newParent, function(err, info) {
          forCb(err, childs)
        })
      })
    }
  }

  var setPositionOfMovedChilds = function(nodeIds, newPositions) {
    var firstNode = nodes[0]
    self._getPosition(parentId, firstNode, function(err, position) {
      self._getAbovePosition(parentId, position, function(err, abovePosition) {
        var lastNode = nodes.pop()
        self._getPosition(parentId, lastNode, function(err, position) {
          self._getNextPosition(parentId, position, function(err, nextPosition) {
            var interval = (nextPosition - abovePosition) / (nodeIds.length + 1)
            console.log('nextPosition', nextPosition)
            console.log('abovePosition', abovePosition)
            console.log('interval', interval)
            if (interval < 10) {
              log.error('// MUST REFRACTOR ALL POSITIONS IN THIS LEVEL', nodeIds, parentId, inverval)
            }
            var forCb = new helpers.asyncCbChecker(nodeIds.length, function(err) {
              if (err) {
                log.error(err)
                return cb(err)
              } else {
                var returnedPositions = {}
                for(key in newPositions) if (newPositions.hasOwnProperty(key)) {
                  returnedPositions[key] = newPositions[key]
                }
                for(key in newChildPositions) if (newChildPositions.hasOwnProperty(key)) {
                  returnedPositions[key] = newChildPositions[key]
                }
                return cb(null, returnedPositions)
              }
            })
            var newChildPositions = {}
            var currentChildPosition = abovePosition
            for (var i = 0, len = nodeIds.length; i < len; i++) {
              currentChildPosition+= interval
              var newChildPosition = Math.round(currentChildPosition)
              newChildPositions[nodeIds[i].id] = newChildPosition
              self.move._sql_setPosition(parentId, nodeIds[i], newChildPosition, forCb)
            }
          })
        })
      })
    })
  }

  this._getPosition(newParentId, aboveId, function(err, abovePosition) {
    self._getNextPosition(newParentId, abovePosition, function(err, nextPosition) {
      var interval = (nextPosition - abovePosition) / (nodes.length + 1)
      if (interval < 10) {
        log.error('// MUST REFRACTOR ALL POSITIONS IN THIS LEVEL', nodeIds, parentId, inverval)
      }
      self.move._sql_updateParents(parentId, nodes, newParentId, function(err, info) {
        if (err) {
          log.error(err)
          return cb('Database error')
        } else {
          if (info.affectedRows != nodes.length) {
            log.error('Update affected more or less rows than it should', info, nodes)
            return cb('Database error')
          } else {
            // Only run the provided callback, when forCb() has been called 'nodes.length' times
            var forCb = new helpers.asyncCbChecker(nodes.length, function(err) {
              if (err) {
                log.error(err)
                return cb(err)
              } else {
                if (!atomic) {
                  return cb(null, newPositions)
                } else {
                  moveChildsUp(nodes, parentId, function(err, nodes) {
                    setPositionOfMovedChilds(nodes, newPositions)
                  })
                }
              }
            })
            var newPositions = {}
            var currentPosition = abovePosition
            for (var i = 0, len = nodes.length; i < len; i++) {
              currentPosition+= interval
              newPosition = Math.round(currentPosition)
              newPositions[nodes[i]] = newPosition
              self.move._sql_setPosition(parentId, nodes[i], newPosition, forCb)
            }
          }
        }
      })
    })
  })
}

exports.move._sql_updateParents = function(parentId, childIds, newParentId, cb) {
  db.query('UPDATE tali_node_hierarchy SET parent_id=?'
  + ' WHERE child_id IN (' + childIds.join(',') + ')'
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
 * Copy one or more nodes to an other location
 * @param parentId {Number} Current parent of the copied nodes
 * @param nodes {Array} Array of node IDs
 * @param newParentId {Number} The new parent ID of the copied nodes
 * @param aboveId {Number} ID of the node above the new location
 * @param atomic {Boolean} If it's an atomic copy, or tree-style copiing (with childs)
 * @param cb {function} cb(err)
 */
exports.copy = function(parentId, nodes, newParentId, aboveId, atomic, cb) {
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

  var self = this
  var saveNewHierarchy = function(newNodeIds, abovePosition, interval, cb) {
    var currentPosition = abovePosition
    // Only run the provided callback, when forCb() has been called 'nodes.length' times
    var forCb = new helpers.asyncCbChecker(newNodeIds.length, function(err, newHierarchy) {
      if (err) {
        log.error(err)
        return cb(err)
      } else {
        newHierarchyIds = []
        for (var i = 0, len = newHierarchy.length; i < len; i++) {
          newHierarchyIds.push(newHierarchy[i].lastInsertId)
        }
        if (atomic) {
          return cb(null, newNodeIds, newHierarchyIds, newPositions)
        } else {
          self.measureImpact(parentId, function(err, isMany) {
            if (err) {
              log.error(err)
              return cb(err)
            } else {
              if (isMany) {
                return cb('Trying to copy too many nodes, the maximum is 100')
              } else {
                //for (var i = 0; newNodeIds)
                //var nodes = self.getLevel()
              }
            }
          })
        }
      }
    })
    var newPositions = {}
    for (var i = 0, len = newNodeIds.length; i < len; i++) {
      currentPosition+= interval
      var newPosition = Math.round(currentPosition)
      newPositions[nodes[i]] = newPosition
      self._sql_createHierarchy(newParentId, newNodeIds[i], newPosition, forCb)
    }
  }
  var getNextPosition = function(abovePosition, newNodeIds) {
    self._sql_selectNextPosition(newParentId, abovePosition, function(err, result) {
      if (err) {
        log.error(err)
        return cb('Database error')
      } else {
        var nextPosition = 0
        if (Object.keys(result[0]).length == 0) {
          nextPosition = self.MAX_POSITION
        } else {
          nextPosition = result[0].position
        }
        var interval = (nextPosition - abovePosition) / (nodes.length + 1)
        if (interval < 1) {
          // MUST REFRACTOR ALL POSITIONS IN THIS LEVEL
        }
        saveNewHierarchy(newNodeIds, abovePosition, interval, cb)
      }
    })
  }
  var copyNodes = function(nodes, cb) {
    for (var i = 0, len = nodes.length; i < len; i++) {
      self.copy._sql_copyNode(nodes[i], function(err, info) {
        cb(err, info.lastInsertId)
      })
    }
  }
  var forCb = new helpers.asyncCbChecker(nodes.length, function(err, newNodeIds) {
    if (err) {
      log.error(err)
      return cb('Database error')
    }
    if (aboveId == 0 || aboveId == null) {
      getNextPosition(0, newNodeIds)
    } else {
      self._sql_selectPosition(newParentId, aboveId, function(err, result) {
        if (err) {
          log.error(err)
          return cb('Database error')
        } else {
          getNextPosition(result[0].position, newNodeIds)
        }
      })
    }
  })
  copyNodes(nodes, forCb)
}

exports.copy._sql_copyNode = function(nodeId, cb) {
  db.query('INSERT INTO tali_node VALUES '
  + '(SELECT NULL, headline, body, now(), now()'
  + ' FROM tali_node WHERE id=?)'
  , [nodeId]
  , function(err, info) {
    return cb(err, info)
  })
}

/**
 * Measuring the impact of a cyclic operation on nodes
 * This checks if the impact affects few or many nodes
 * Currently many is defined as: 100 nodes
 * @param parentId {Number} Node id to measure
 * @param cb {function} cb(err, isMany)
 */
exports.measureImpact = function(parentId, cb) {
  cb = cb || function() {}

  if (typeof cb != 'function')
    return

  if (parseInt(parentId) != parentId)
    return cb('ParentId must be a Number')

  var foundNum = 0
  var end = false
  var nodes = [parentId]
  while (foundNum < 100 && !end) {
    this._sql_selectChildIds(nodes, function(err, result) {
      if (err) {
        log.error(err)
        return cb('Database error')
      } else {
        if (result.length == 0) {
          end = true
        }
        foundNum+= result.length
        nodes = result
      }
    })
  }
  if (foundNum < 100) {
    return cb(null, false)
  } else {
    return cb(null, true)
  }
}

exports._sql_selectChildIds = function(parentIds, cb) {
  db.query('SELECT child_id FROM tali_node'
  + ' WHERE parent_id IN (' + parentIds.join(',') + ')'
  , function(err, result) {
    return cb(err, result)
  })
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
