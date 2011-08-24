var debug = true

var paths = require('../../app/paths')
  , node = require('node')

exports['Node get level'] = function(test) {
  test.expect(5)

  test.equal(typeof node.getLevel, 'function')
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
  test.expect(4)

  test.equal(typeof node.editHeadline, 'function')
  test.doesNotThrow(function() {
    node.editHeadline(null, '', function(err) {
      test.equal(err, 'A node ID szám kell hogy legyen!')
    })
    node.editHeadline(1, null, function(err) {
      test.equal(err, 'Az új tartalom String kell hogy legyen!')
    })
  })

  test.done()
}
exports['Node edit body'] = function(test) {
  test.expect(4)

  test.equal(typeof node.editBody, 'function')
  test.doesNotThrow(function() {
    node.editBody(null, '', function(err) {
      test.equal(err, 'A node ID szám kell hogy legyen!')
    })
    node.editBody(1, null, function(err) {
      test.equal(err, 'Az új tartalom String kell hogy legyen!')
    })
  })

  test.done()
}