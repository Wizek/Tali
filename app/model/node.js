
/**
 * Module dependencies
 */
var log = require('log')
  , db = require('db')

/**
 * Global variable
 */
var NODE_MAX_POSITION = 8388607

/**
 * Get node level
 * @param id {Number} parent ID
 * @param cb {function} cb(err, data)
 */
exports.getLevel = function(id, cb) {
  cb = cb || function() {}

  if (parseInt(id) != id)
    return cb('A parent ID szám kell hogy legyen!')

  this.getLevel._sql_getLevel(id, function(err, results) {
    if (err) {
      log.error(err)
      return cb('Database error')
    } else {
      return cb(null, results)
    }
  })
}

exports.getLevel._sql_getLevel = function(id, cb) {
  db.query('SELECT tali_node.*, hierarchy.parent_id,'
        +' (SELECT count(child_id) FROM tali_node_hierarchy WHERE parent_id=tali_node.id) AS childnum'
        +' FROM tali_node'
        +' LEFT JOIN tali_node_hierarchy hierarchy ON hierarchy.child_id=tali_node.id'
        +' WHERE hierarchy.parent_id=?'
        +' ORDER BY hierarchy.position'
  , [id]
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

  if (parseInt(parentId) != parentId)
    return cb('A parent ID szám kell hogy legyen!')

  if (parseInt(aboveId) != aboveId)
    return cb('Az above ID szám kell hogy legyen!')

  if (parseInt(userId) != userId)
    return cb('A user ID szám kell hogy legyen!')

  var abovePosition = 0
  var nextPosition = 0
  var that = this
  var cb_afterPosition = function(abovePosition) {
    that.newNode._sql_selectNextNode(parentId, abovePosition, function(err, result) {
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
    cb_afterPosition(0)
  } else {
    this.newNode._sql_selectPosition(parentId, aboveId, function(err, result) {
      cb_afterPosition(result[0].position)
    })
  }
}

exports.newNode._sql_selectPosition = function(parentId, aboveId, cb) {
  db.query('SELECT position FROM tali_node_hierarchy'
  + ' WHERE parent_id = ? AND child_id=?'
  , [parentId, aboveId]
  , function(err, result) {
      return cb(err, result)
    }
  )
}

exports.newNode._sql_selectNextNode = function(parentId, abovePosition, cb) {
  db.query('SELECT child_id, position FROM tali_node_hierarchy'
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

exports.newNode._sql_saveHierarchy = function(parentId, newId, position, cb) {
  db.query('INSERT INTO tali_node_hierarchy(parent_id, child_id, position)'
  + ' VALUES (?, ?, ?)'
  , [parentId, newId, position]
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

  if (parseInt(id) != id)
    return cb('A node ID szám kell hogy legyen!')

  if (typeof newText != 'string')
    return cb('Az új tartalom String kell hogy legyen!')

  if (typeof userId != 'number')
    return cb('A userId-nek Number-nek kell lennie!')

  this.editHeadline._sql_save(id, newText, function(err, result) {
    if (err) {
      log.error(err)
      return cb('Database error')
    } else {
      if (result.affectedRows != 1) {
        return cb('Nem találom a node-ot!')
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
    return cb('A node ID szám kell hogy legyen!')

  if (typeof newText != 'string')
    return cb('Az új tartalom String kell hogy legyen!')

  if (typeof userId != 'number')
    return cb('A userId-nek Number-nek kell lennie!')

  this.editBody._sql_save(id, newText, function(err, result) {
    if (err) {
      log.error(err)
      return cb('Database error')
    } else {
      if (result.affectedRows != 1) {
        return cb('Nem találom a node-ot!')
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
