var debug = true

var node = require('../../app/model/node')

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
  test.expect(4)

  test.equal(typeof node.newNode, 'function')
  test.doesNotThrow(function() {
    node.newNode(null, 1, function(err) {
      test.equal(err, 'ParentId must be a Number')
    })
    node.newNode(1, null, function(err) {
      test.equal(err, 'AboveId must be a Number')
    })
  })
  test.done()
}

exports['New node creation on top of current nodes'] = function(test) {
  test.expect(2)

  node._sql_selectNextPosition = function(parentId, abovePosition, cb) {
    if (parentId == 1 && abovePosition == 0) {
      return cb(null, [{position: 400}])
    }
    return cb('Test error')
  }
  node.newNode._sql_createEmptyNode = function(cb) {
    return cb(null, {insertId: 59})
  }
  node._sql_createHierarchy = function(parentId, newId, newPosition, cb) {
    return cb(null, {insertId: 44})
  }

  node.newNode(1, 0, function(err, nodeId, nodePosition) {
    test.equal(nodeId, 59)
    test.equal(nodePosition, 200)
  })

  test.done()
}

exports['New node creation at the end of all nodes'] = function(test) {
  test.expect(2)

  node._sql_selectPosition = function(parentId, childId, cb) {
    if (parentId == 1 && childId == 3) {
      return cb(null, [{position: 200}])
    }
    return cb('Test error')
  }
  node._sql_selectNextPosition = function(parentId, abovePosition, cb) {
    if (parentId == 1 && abovePosition == 200) {
      return cb(null, [{}])
    }
    return cb('Test error')
  }
  node.newNode._sql_createEmptyNode = function(cb) {
    return cb(null, {insertId: 59})
  }
  node._sql_createHierarchy = function(parentId, newId, newPosition, cb) {
    return cb(null, {insertId: 44})
  }

  node.newNode(1, 3, function(err, nodeId, nodePosition) {
    test.equal(nodeId, 59)
    test.equal(nodePosition, Math.round((node.MAX_POSITION + 200) / 2))
  })

  test.done()
}

exports['New node creation at normal position'] = function(test) {
  test.expect(2)

  node._sql_selectPosition = function(parentId, childId, cb) {
    if (parentId == 1 && childId == 2) {
      return cb(null, [{position: 200}])
    }
    return cb('Test error')
  }
  node._sql_selectNextPosition = function(parentId, abovePosition, cb) {
    if (parentId == 1 && abovePosition == 200) {
      return cb(null, [{position: 400}])
    }
    return cb('Test error')
  }
  node.newNode._sql_createEmptyNode = function(cb) {
    return cb(null, {insertId: 59})
  }
  node._sql_saveHierarchy = function(parentId, newId, newPosition, cb) {
    return cb(null, {insertId: 44})
  }

  node.newNode(1, 2, function(err, nodeId, nodePosition) {
    test.equal(nodeId, 59)
    test.equal(nodePosition, 300)

    test.done()
  })
}

exports['New node creation by position exists'] = function(test) {
  test.equal(typeof node.newNodeByPosition, 'function')

  test.doesNotThrow(function() {
    node.newNodeByPosition(null, 1, function(err) {
      test.equal(err, 'ParentId must be a Number')
    })
    node.newNodeByPosition(1, null, function(err) {
      test.equal(err, 'Position must be a Number')
    })
  })
  test.done()
}

exports['New node creation by position works'] = function(test) {
  test.expect(1)

  node.newNode._sql_createEmptyNode = function(cb) {
    return cb(null, {insertId: 59})
  }
  node._sql_saveHierarchy = function(parentId, newId, newPosition, cb) {
    return cb(null, {insertId: 44})
  }

  node.newNodeByPosition(1, 20000, function(err, nodeId) {
    test.equal(nodeId, 59)

    test.done()
  })
}

exports['Node delete exists'] = function(test) {
  test.expect(4)

  test.equal(typeof node.delete, 'function')
  test.doesNotThrow(function() {
    node.delete(null, 1, function(err) {
      test.equal(err, 'ParentId must be a Number')
    })
     node.delete(1, null, function(err) {
      test.equal(err, 'ChildId must be a Number')
    })
  })

  test.done()
}

exports['Delete node'] = function(test) {
  test.expect(1)

  node.delete._sql_deleteNode = function(parentId, childId, cb) {
    return cb()
  }

  node.delete(1, 2, function(err) {
    test.equal(err, null)
  })

  test.done()
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
   * Tree-style moving nodes [2, 3] after 4
   * Tested structure       Waited structure
   * - nodeId (position)    - nodeId (position)
   * - 1 (200)              - 1 (200)
   *   - 2 (100)              - 4 (300)
   *     - 7 (300)            - 2 (333)
   *       - 10 (300)           - 7 (300)
   *     - 8 (450)                - 10 (300)
   *   - 3 (200)                - 8 (450)
   *     - 9 (300)            - 3 (367)
   *   - 4 (300)                - 9 (300)
   *   - 5 (400)              - 5 (400)
   *   - 6 (500)              - 6 (500)
   */
  test.expect(2)

  node._sql_selectPosition = function(parentId, childId, cb) {
    if (parentId == 1 && childId == 4) {
      return cb(null, [{position: 300}])
    }
    return cb('Test error')
  }
  node._sql_selectNextPosition = function(parentId, abovePosition, cb) {
    if (parentId == 1 && abovePosition == 300) {
      return cb(null, [{position: 400}])
    }
    return cb('Test error')
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
   * Tree-style moving node [2] under 3 after 9
   * Tested structure       Waited structure
   * - nodeId (position)    - nodeId (position)
   * - 1 (200)              - 1 (200)
   *   - 2 (100)              - 3 (200)
   *     - 7 (300)              - 9 (300)
   *       - 11 (300)           - 2 (350)
   *     - 8 (450)                - 7 (300)
   *   - 3 (200)                    -11 (300)
   *     - 9 (300)                - 8 (450)
   *     - 10 (400)             - 10 (400)
   *   - 4 (300)              - 4 (300)
   *   - 5 (400)              - 5 (400)
   *   - 6 (500)              - 6 (500)
   */
  test.expect(2)

  node._sql_selectPosition = function(parentId, childId, cb) {
    if (parentId == 3 && childId == 9) {
      return cb(null, [{position: 300}])
    }
    return cb('Test error')
  }
  node._sql_selectNextPosition = function(parentId, abovePosition, cb) {
    if (parentId == 3 && abovePosition == 300) {
      return cb(null, [{position: 400}])
    }
    return cb('Test error')
  }
  node.move._sql_updateParents = function(parentId, nodes, newParentId, cb) {
    return cb(null, {affectedRows: nodes.length})
  }
  node.move._sql_setPosition = function(parentId, childId, newPosition, cb) {
    return cb(null, {affectedRows: 1})
  }

  node.move(1, [2], 3, 9, false, function(err, newPositions) {
    test.equal(err, null)
    test.deepEqual(newPositions, {'2': 350})

    test.done()
  })
}

exports['Moving node(s) atomic in the same level'] = function(test) {
  /*
   * Atomic moving nodes [3, 4] after 6
   * Tested structure       Waited structure
   * - nodeId (position)    - nodeId (position)
   * - 1 (200)              - 1 (200)
   *   - 2 (100)              - 2 (100)
   *   - 3 (200)              - 8 (175)
   *     - 8 (300)              - 10 (300)
   *       - 10 (300)         - 9 (250)
   *     - 9 (450)            - 11 (325)
   *   - 4 (300)              - 5 (400)
   *     - 11 (300)           - 6 (500)
   *   - 5 (400)              - 3 (533)
   *   - 6 (500)              - 4 (567)
   *   - 7 (600)              - 7 (600)
   */
  test.expect(2)

  node._sql_selectPosition = function(parentId, childId, cb) {
    if (parentId == 1 && childId == 6) {
      return cb(null, [{position: 500}])
    }
    if (parentId == 1 && childId == 3) {
      return cb(null, [{position: 200}])
    }
    if (parentId == 1 && childId == 4) {
      return cb(null, [{position: 300}])
    }
    return cb('Test error')
  }
  node._sql_selectNextPosition = function(parentId, abovePosition, cb) {
    if (parentId == 1 && abovePosition == 500) {
      return cb(null, [{position: 600}])
    }
    if (parentId == 1 && abovePosition == 300) {
      return cb(null, [{position: 400}])
    }
    return cb('Test error')
  }
  node.move._sql_updateParents = function(parentId, nodes, newParentId, cb) {
    return cb(null, {affectedRows: nodes.length})
  }
  node.move._sql_setPosition = function(parentId, childId, newPosition, cb) {
    return cb(null, {affectedRows: 1})
  }
  node.getLevel = function(parentId, cb) {
    if (parentId == 3) {
      return cb(null, [{'id': 8}, {'id': 9}])
    }
    if (parentId == 4) {
      return cb(null, [{'id': 11}])
    }
    return cb('Test error')
  }
  node._sql_selectAbovePosition = function(parentId, nextPosition, cb) {
    if (parentId == 1 && nextPosition == 200) {
      return cb(null, [{position: 100}])
    }
    return cb('Test error')
  }

  node.move(1, [3, 4], 1, 6, true, function(err, newPositions) {
    test.equal(err, null)
    test.deepEqual(newPositions,
      {
        '3': 533
      , '4': 567
      , '8': 175
      , '9': 250
      , '11': 325
      }
    )
    test.done()
  })
}

exports['Moving node(s) atomic to an upper level'] = function(test) {
  /*
   * Atomic moving nodes [8, 9] under 1 after 5
   * Tested structure       Waited structure
   * - nodeId (position)    - nodeId (position)
   * - 1 (200)              - 1 (200)
   *   - 2 (100)              - 2 (100)
   *   - 3 (200)              - 3 (200)
   *     - 7 (300)              - 7 (300)
   *     - 8 (400)              - 11 (375)
   *       - 11 (300)           - 12 (450)
   *       - 12 (450)           - 13 (525)
   *     - 9 (500)              - 10 (600)
   *       - 13 (300)         - 4 (300)
   *     - 10 (600)           - 5 (400)
   *   - 4 (300)              - 8 (433)
   *   - 5 (400)              - 9 (467)
   *   - 6 (500)              - 6 (500)
   */
  test.expect(2)

  node._sql_selectPosition = function(parentId, childId, cb) {
    if (parentId == 1 && childId == 5) {
      return cb(null, [{position: 400}])
    }
    if (parentId == 3 && childId == 8) {
      return cb(null, [{position: 400}])
    }
    if (parentId == 3 && childId == 9) {
      return cb(null, [{position: 500}])
    }
    if (parentId == 3 && childId == 10) {
      return cb(null, [{position: 600}])
    }
    return cb('Test error')
  }
  node._sql_selectNextPosition = function(parentId, abovePosition, cb) {
    if (parentId == 1 && abovePosition == 400) {
      return cb(null, [{position: 500}])
    }
    if (parentId == 3 && abovePosition == 500) {
      return cb(null, [{position: 600}])
    }
    return cb('Test error')
  }
  node.move._sql_updateParents = function(parentId, nodes, newParentId, cb) {
    return cb(null, {affectedRows: nodes.length})
  }
  node.move._sql_setPosition = function(parentId, childId, newPosition, cb) {
    return cb(null, {affectedRows: 1})
  }
  node.getLevel = function(parentId, cb) {
    if (parentId == 8) {
      return cb(null, [{'id': 11}, {'id': 12}])
    }
    if (parentId == 9) {
      return cb(null, [{'id': 13}])
    }
    return cb('Test error')
  }
  node._sql_selectAbovePosition = function(parentId, nextPosition, cb) {
    if (parentId == 3 && nextPosition == 400) {
      return cb(null, [{position: 300}])
    }
    return cb('Test error')
  }
  node.move(3, [8, 9], 1, 5, true, function(err, newPositions) {
    test.equal(err, null)
    test.deepEqual(newPositions,
      {
        '8': 433
      , '9': 467
      , '11': 375
      , '12': 450
      , '13': 525
      }
    )
    test.done()
  })
}

exports['Moving one nodes whole tree to other level with given new position'] = function(test) {
  test.expect(7)

  test.equal(typeof node.moveWholeTree, 'function')
  test.doesNotThrow(function() {
    node.moveWholeTree(null, 2, 3, 122222, function(err) {
      test.equal(err, 'ParentId must be a Number')
    })
    node.moveWholeTree(1, null, 3, 122222, function(err) {
      test.equal(err, 'ChildId must be a Number')
    })
    node.moveWholeTree(1, 2, null, 122222, function(err) {
      test.equal(err, 'NewParentId must be a Number')
    })
    node.moveWholeTree(1, 2, 3, null, function(err) {
      test.equal(err, 'NewPosition must be a Number')
    })
  })

  node.moveWholeTree._sql_updateHierarchy = function(parentId, childId, newParentId, newPosition, cb) {
    return cb(null, {affectedRows: 1})
  }

  node.moveWholeTree(1, 2, 1, 122222, function(err) {
    test.equal(err, null)
  })

  test.done()
}

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