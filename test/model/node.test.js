var debug = true

var paths = require('../../app/paths')
  , node = require('node')

exports['Node get level'] = function(test) {
  test.expect(6)

  test.equal(typeof node.getLevel, 'function')
  test.equal(typeof node.getLevel._sql_getLevel, 'function')
  test.doesNotThrow(function() {
    node.getLevel(null, function(err) {
      test.equal(err, 'ParentId must be a Number')
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

exports['New node creation exists'] = function(test) {
  test.expect(7)

  test.equal(typeof node.newNode, 'function')
  test.equal(typeof node._sql_selectPosition, 'function')
  test.equal(typeof node._sql_selectNextPosition, 'function')
  test.doesNotThrow(function() {
    node.newNode(null, 1, 1, function(err) {
      test.equal(err, 'ParentId must be a Number')
    })
    node.newNode(1, null, 1, function(err) {
      test.equal(err, 'AboveId must be a Number')
    })
    node.newNode(1, 1, null, function(err) {
      test.equal(err, 'UserId must be a Number')
    })
  })
  test.done()
}

exports['New node creation on top of current nodes'] = function(test) {
  test.expect(2)

  node._sql_selectNextPosition = function(parentId, abovePosition, cb) {
    return cb(null, [{position: 400}])
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

  node._sql_selectPosition = function(parentId, aboveId, cb) {
    return cb(null, [{position: 200}])
  }
  node._sql_selectNextPosition = function(parentId, abovePosition, cb) {
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

  node._sql_selectPosition = function(parentId, aboveId, cb) {
    return cb(null, [{position: 200}])
  }
  node._sql_selectNextPosition = function(parentId, abovePosition, cb) {
    return cb(null, [{position: 400}])
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

    test.done()
  })
}

exports['Moving node(s) exists'] = function(test) {
  test.expect(9)

  test.equal(typeof node.move, 'function')
  test.equal(typeof node.move._sql_setParents, 'function')
  test.equal(typeof node.move._sql_setPosition, 'function')
  test.doesNotThrow(function() {
    node.move(null, [2], 1, 3, true, function(err) {
      test.equal(err, 'ParentId must be a Number')
    })
    node.move(1, null, 1, 3, true, function(err) {
      test.equal(err, 'Nodes must be an Array')
    })
    node.move(1, [2], null, 3, true, function(err) {
      test.equal(err, 'NewParentId must be a Number')
    })
    node.move(1, [2], 1, null, true, function(err) {
      test.equal(err, 'AboveId must be a Number')
    })
    node.move(1, [2], 1, 3, 'false', function(err) {
      test.equal(err, 'Atomic must be a Boolean')
    })
  })

  test.done()
}

exports['Moving node(s) tree-style in the same level'] = function(test) {
  /*
   * Tested structure
   * - nodeId (position)
   * - 1 (200)
   *   - 2 (100)
   *     - 7 (300)
   *       - 10 (300)
   *     - 8 (450)
   *   - 3 (200)
   *     - 9 (300)
   *   - 4 (300)
   *   - 5 (400)
   *   - 6 (500)
   *
   * Waited structure
   * - 1 (200)
   *   - 4 (300)
   *   - 2 (333)
   *     - 7 (100)
   *       - 10 (300)
   *     - 8 (450)
   *   - 3 (367)
   *     - 9 (300)
   *   - 5 (400)
   *   - 6 (500)
   */
  test.expect(4)

  var Run = {}
  Run._sql_setParents = 0
  Run._sql_setPosition = 0

  node._sql_selectPosition = function(parentId, aboveId, cb) {
    return cb(null, [{position: 300}])
  }
  node._sql_selectNextPosition = function(parentId, abovePosition, cb) {
    return cb(null, [{position: 400}])
  }
  node.move._sql_setParents = function(parentId, nodes, newParentId, cb) {
    Run._sql_setParents++
    return cb(null, {affectedRows: nodes.length})
  }
  node.move._sql_setPosition = function(parentId, childId, newPosition, cb) {
    Run._sql_setPosition++
    return cb(null, {affectedRows: 1})
  }

  node.move(1, [2, 3], 1, 4, false, function(err, newPositions) {
    test.equal(err, null)
    test.deepEqual(newPositions, {'2': 333, '3': 367})
    test.equal(Run._sql_setParents, 1)
    test.equal(Run._sql_setPosition, 2)

    test.done()
  })
}

/*exports['Moving node(s) atomic in the same level'] = function(test) {
  /*
   * Tested structure
   * - nodeId (position)
   * - 1 (200)
   *   - 2 (100)
   *     - 7 (300)
   *       - 10 (300)
   *     - 8 (450)
   *   - 3 (200)
   *     - 9 (300)
   *   - 4 (300)
   *   - 5 (400)
   *   - 6 (500)
   *
   * Waited structure
   * - 1 (200)
   *   - 4 (300)
   *   - 2 (333)
   *   - 3 (367)
   *   - 5 (400)
   *   - 6 (500)
   *   - 7 (533)
   *     - 10(300)
   *   - 8 (567)
   *   - 9 (583)
   * /
  test.expect(0)
  test.done()
}*/

exports['Node edit headline'] = function(test) {
  test.expect(6)

  test.equal(typeof node.editHeadline, 'function')
  test.equal(typeof node.editHeadline._sql_save, 'function')
  test.doesNotThrow(function() {
    node.editHeadline(null, '', 1, function(err) {
      test.equal(err, 'NodeId must be a Number')
    })
    node.editHeadline(1, null, 1, function(err) {
      test.equal(err, 'NewText must be a String')
    })
    node.editHeadline(1, '', null, function(err) {
      test.equal(err, 'UserId must be a Number')
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
      test.equal(err, 'NodeId must be a Number')
    })
    node.editBody(1, null, 1, function(err) {
      test.equal(err, 'NewText must be a String')
    })
    node.editBody(1, '', null, function(err) {
      test.equal(err, 'UserId must be a Number')
    })
  })

  test.done()
}