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
  test.expect(5)

  test.equal(typeof node.newNode, 'function')
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
  node._sql_createHierarchy = function(parentId, newId, newPosition, cb) {
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
  node._sql_createHierarchy = function(parentId, newId, newPosition, cb) {
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
  node._sql_saveHierarchy = function(parentId, newId, newPosition, cb) {
    return cb(null, {insertId: 44})
  }

  node.newNode(1, 1, 1, function(err, nodeId, nodePosition) {
    test.equal(nodeId, 59)
    test.equal(nodePosition, 300)

    test.done()
  })
}

exports['Node moving exists'] = function(test) {
  test.expect(7)

  test.equal(typeof node.move, 'function')
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

exports['Moving nodes tree-style in the same level'] = function(test) {
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
  test.expect(2)

  node._sql_selectPosition = function(parentId, aboveId, cb) {
    return cb(null, [{position: 300}])
  }
  node._sql_selectNextPosition = function(parentId, abovePosition, cb) {
    return cb(null, [{position: 400}])
  }
  node.move._sql_updateParents = function(parentId, nodes, newParentId, cb) {
    return cb(null, {affectedRows: nodes.length})
  }
  node.move._sql_setPosition = function(parentId, childId, newPosition, cb) {
    return cb(null, {affectedRows: 1})
  }

  node.move(1, [2, 3], 1, 4, false, function(err, newPositions) {
    test.equal(err, null)
    test.deepEqual(newPositions, {'2': 333, '3': 367})

    test.done()
  })
}

exports['Moving nodes tree-style to an other level'] = function(test) {
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
   *   - 3 (200)
   *     - 9 (300)
   *     - 2 (350)
   *       - 7 (300)
   *         -10 (300)
   *       - 8 (450)
   *   - 4 (300)
   *   - 5 (400)
   *   - 6 (500)
   */
  test.expect(2)

  node._sql_selectPosition = function(parentId, aboveId, cb) {
    return cb(null, [{position: 300}])
  }
  node._sql_selectNextPosition = function(parentId, abovePosition, cb) {
    return cb(null, [{position: node.MAX_POSITION}])
  }
  node.move._sql_updateParents = function(parentId, nodes, newParentId, cb) {
    return cb(null, {affectedRows: nodes.length})
  }
  node.move._sql_setPosition = function(parentId, childId, newPosition, cb) {
    return cb(null, {affectedRows: 1})
  }

  node.move(1, [2], 3, 9, false, function(err, newPositions) {
    test.equal(err, null)
    test.deepEqual(newPositions, {'2': 4194454})

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

exports['Node copiing'] = function(test) {
  test.expect(11)

  test.equal(typeof node.copy, 'function')
  test.doesNotThrow(function() {
    node.copy(null, [2], 3, 4, true, function(err) {
      test.equal(err, 'ParentId must be a Number')
    })
    node.copy(1, null, 3, 4, true, function(err) {
      test.equal(err, 'Nodes must be an Array')
    })
    node.copy(1, [2], null, 4, true, function(err) {
      test.equal(err, 'NewParentId must be a Number')
    })
    node.copy(1, [2], 3, null, true, function(err) {
      test.equal(err, 'AboveId must be a Number')
    })
    node.copy(1, [2], 3, 4, null, function(err) {
      test.equal(err, 'Atomic must be a Boolean')
    })
  })

  var copied = 5
  node.copy._sql_copyNode = function(nodeId, cb) {
    copied++
    return cb(null, {lastInsertId: copied})
  }
  node._sql_selectPosition = function(parentId, childId, cb) {
    return cb(null, [{position: 300}])
  }
  node._sql_selectNextPosition = function(parentId, abovePosition, cb) {
    if (abovePosition == 300) {
      return cb(null, [{position: 400}])
    } else {
      return cb(null, [{position: 800}])
    }
  }
  var hierarchy_saved = 11
  node._sql_saveHierarchy = function(parentId, childId, position, cb) {
    hierarchy_saved++
    return cb(null, {lastInsertId: hierarchy_saved})
  }
  node.copy(1, [2, 3], 4, 5, true, function(err, newNodeIds, newHierarchyIds, newPositions) {
    test.equal(err, null)
    test.deepEqual(newNodeIds, [6, 7])
    test.deepEqual(newHierarchyIds, [12, 13])
    test.deepEqual(newPositions, {'2': 333, '3': 367})
  })

  test.done()
}

exports['Measurement exists'] = function(test) {
  test.expect(3)

  test.equal(typeof node.measureImpact, 'function')
  test.doesNotThrow(function() {
    node.measureImpact(null, function(err) {
      test.equal(err, 'ParentId must be a Number')
    })
  })

  test.done()
}

exports['Measuring that just few nodes involved'] = function(test) {
  test.expect(2)

  node._sql_selectChildIds = function(parentIds, cb) {
    if (parentIds.length == 1 && parentIds[0] == 1) {
      return cb(null, [2, 3, 4, 5])
    } else if (parentIds.length == 4
      && parentIds[0] == 2 && parentIds[1] == 3
      && parentIds[2] == 4 && parentIds[3] == 5)
    {
      var nodes = []
      for (var i = 6; i < 56; i++) {
        nodes.push(i)
      }
      return cb(null, nodes)
    } else {
      return cb(null, [])
    }
  }

  node.measureImpact(1, function(err, isMany) {
    test.equal(err, null)
    test.equal(isMany, false)
    test.done()
  })
}

exports['Measuring that many nodes involved'] = function(test) {
  test.expect(2)

  node._sql_selectChildIds = function(parentIds, cb) {
    if (parentIds.length == 1 && parentIds[0] == 1) {
      return cb(null, [2, 3, 4, 5])
    } else if (parentIds.length == 4
      && parentIds[0] == 2 && parentIds[1] == 3
      && parentIds[2] == 4 && parentIds[3] == 5)
    {
      var nodes = []
      for (var i = 6; i < 156; i++) {
        nodes.push(i)
      }
      return cb(null, nodes)
    } else {
      return cb(null, [])
    }
  }

  node.measureImpact(1, function(err, isMany) {
    test.equal(err, null)
    test.equal(isMany, true)
    test.done()
  })
}

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