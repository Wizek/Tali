var debug = true

var paths = require('../../app/paths')
  , node = require('node')

exports['Node get level'] = function(test) {
  test.expect(6)

  test.equal(typeof node.getLevel, 'function')
  test.equal(typeof node.getLevel._sql_getLevel, 'function')
  test.doesNotThrow(function() {
    node.getLevel(null, function(err) {
      test.equal(err, 'A parent ID szám kell hogy legyen!')
    })
  })

  node.getLevel._sql_getLevel = function(id, cb) {
    return cb(null, [{}])
  }

  node.getLevel(1, function(err, results) {
    test.equal(err, null)
    test.deepEqual(results, [{}])
  })

  test.done()
}

exports['New node creation'] = function(test) {
  test.expect(7)

  test.equal(typeof node.newNode, 'function')
  test.equal(typeof node.newNode._sql_selectPosition, 'function')
  test.equal(typeof node.newNode._sql_selectNextNode, 'function')
  test.doesNotThrow(function() {
    node.newNode(null, 1, 1, function(err) {
      test.equal(err, 'A parent ID szám kell hogy legyen!')
    })
    node.newNode(1, null, 1, function(err) {
      test.equal(err, 'Az above ID szám kell hogy legyen!')
    })
    node.newNode(1, 1, null, function(err) {
      test.equal(err, 'A user ID szám kell hogy legyen!')
    })
  })
  test.done()
}

exports['New node creation on top of current nodes'] = function(test) {
  test.expect(2)

  node.newNode._sql_selectNextNode = function(parentId, abovePosition, cb) {
    return cb(null, [{child_id: 2, position: 400}])
  }
  node.newNode._sql_createEmptyNode = function(cb) {
    return cb(null, {insertId: 59})
  }
  node.newNode._sql_saveHierarchy = function(parentId, newId, newPosition, cb) {
    return cb(null, {insertId: 44})
  }

  node.newNode(1, 0, 1, function(err, nodeId, nodePosition) {
    test.equal(nodeId, 59)
    test.equal(nodePosition, 200)
  })

  test.done()
}

exports['New node creation at the end of all nodes'] = function(test) {
  test.expect(2)

  node.newNode._sql_selectPosition = function(parentId, aboveId, cb) {
    return cb(null, [{position: 200}])
  }
  node.newNode._sql_selectNextNode = function(parentId, abovePosition, cb) {
    return cb(null, [{}])
  }
  node.newNode._sql_createEmptyNode = function(cb) {
    return cb(null, {insertId: 59})
  }
  node.newNode._sql_saveHierarchy = function(parentId, newId, newPosition, cb) {
    return cb(null, {insertId: 44})
  }

  node.newNode(1, 2, 1, function(err, nodeId, nodePosition) {
    test.equal(nodeId, 59)
    test.equal(nodePosition, 4194404) // (NODE_MAX_POSITION / 2) + 100
  })

  test.done()
}

exports['New node creation at normal position'] = function(test) {
  test.expect(2)

  node.newNode._sql_selectPosition = function(parentId, aboveId, cb) {
    return cb(null, [{position: 200}])
  }
  node.newNode._sql_selectNextNode = function(parentId, abovePosition, cb) {
    return cb(null, [{child_id: 2, position: 400}])
  }
  node.newNode._sql_createEmptyNode = function(cb) {
    return cb(null, {insertId: 59})
  }
  node.newNode._sql_saveHierarchy = function(parentId, newId, newPosition, cb) {
    return cb(null, {insertId: 44})
  }

  node.newNode(1, 1, 1, function(err, nodeId, nodePosition) {
    test.equal(nodeId, 59)
    test.equal(nodePosition, 300)
  })

  test.done()
}

exports['Node edit headline'] = function(test) {
  test.expect(6)

  test.equal(typeof node.editHeadline, 'function')
  test.equal(typeof node.editHeadline._sql_save, 'function')
  test.doesNotThrow(function() {
    node.editHeadline(null, '', 1, function(err) {
      test.equal(err, 'A node ID szám kell hogy legyen!')
    })
    node.editHeadline(1, null, 1, function(err) {
      test.equal(err, 'Az új tartalom String kell hogy legyen!')
    })
    node.editHeadline(1, '', null, function(err) {
      test.equal(err, 'A userId-nek Number-nek kell lennie!')
    })
  })

  test.done()
}
exports['Node edit body'] = function(test) {
  test.expect(6)

  test.equal(typeof node.editBody, 'function')
  test.equal(typeof node.editBody._sql_save, 'function')
  test.doesNotThrow(function() {
    node.editBody(null, '', 1, function(err) {
      test.equal(err, 'A node ID szám kell hogy legyen!')
    })
    node.editBody(1, null, 1, function(err) {
      test.equal(err, 'Az új tartalom String kell hogy legyen!')
    })
    node.editBody(1, '', null, function(err) {
      test.equal(err, 'A userId-nek Number-nek kell lennie!')
    })
  })

  test.done()
}