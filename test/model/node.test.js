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