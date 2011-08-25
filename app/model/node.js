
/**
 * Module dependencies
 */
var log = require('log')
  , db = require('db')

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
