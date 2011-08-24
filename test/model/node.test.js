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
