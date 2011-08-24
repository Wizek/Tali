
/**
 * Module dependencies
 */
var log = require('log')
  , db = require('db')

/*
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
        +' WHERE hierarchy.parent_id=' + id
  , function(err, results) {
      return cb(err, results)
    }
  )
}
