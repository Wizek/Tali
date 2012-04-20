require('../test_helper.js').controller('users', module.exports)

var sinon  = require('sinon')

function ValidAttributes () {
  return {
    username: 'User'
    , password: '12345678'
    , admin: false
    , email: 'asd@asd.com'
    , created_at: new Date()
    , updated_at: new Date()
  }
}

exports['users controller'] = {

  'GET new': function (test) {
    test.get('/signup', function () {
      test.success()
      test.render('new')
      // test.render('new.' + app.set('view engine'))
      test.done()
    })
  },
  'POST create fails without secret_code': function (test) {
    var user = new ValidAttributes
    var create = User.create
    User.create = sinon.spy(function (data, callback) {
      test.strictEqual(data, user)
      callback(null, user)
    })
    test.post('/users', {User: user}, function () {
      //test.redirect('/users/new')
      test.flash('error', 'asdasd')
      test.done()
    })
  },
  'POST create passes with secret_code': function (test) {
    var user = new ValidAttributes
    user.secret_code = 'd2CUtD7cWdSBspTS'
    var create = User.create
    User.create = sinon.spy(function (data, callback) {
      test.deepEqual(data, user)
      callback(null, user)
    })
    test.post('/users', {User: user}, function () {
      test.redirect('/')
      // test.flash('info')
      test.flash('success')
      // test.render('application_layout')
      test.done()
    })
  },
  'POST create fails for invalid data': function (test) {
    var user =
      { secret_code: 'd2CUtD7cWdSBspTS'
      , username: 1
      , password: 'unsafe'
      , email: undefined // missing
      }
    var create = User.create
    User.create = sinon.spy(function (data, callback) {
      test.strictEqual(data, user)
      callback(new Error, user)
    })
    test.post('/users', {User: user}, function () {
      test.flash('error')
      test.done()
    })
  },


  // 'GET index': function (test) {
  //     test.get('/posts', function () {
  //         test.success()
  //         test.render('index')
  //         test.done()
  //     })
  // },

  // 'GET edit': function (test) {
  //     var find = Post.find
  //     Post.find = sinon.spy(function (id, callback) {
  //         callback(null, new Post)
  //     })
  //     test.get('/posts/42/edit', function () {
  //         test.ok(Post.find.calledWith('42'))
  //         Post.find = find
  //         test.success()
  //         test.render('edit')
  //         test.done()
  //     })
  // },

  // 'GET show': function (test) {
  //     var find = Post.find
  //     Post.find = sinon.spy(function (id, callback) {
  //         callback(null, new Post)
  //     })
  //     test.get('/posts/42', function (req, res) {
  //         test.ok(Post.find.calledWith('42'))
  //         Post.find = find
  //         test.success()
  //         test.render('show')
  //         test.done()
  //     })
  // },

  // 'POST create': function (test) {
  //     var post = new ValidAttributes
  //     var create = Post.create
  //     Post.create = sinon.spy(function (data, callback) {
  //         test.strictEqual(data, post)
  //         callback(null, post)
  //     })
  //     test.post('/posts', {Post: post}, function () {
  //         test.redirect('/posts')
  //         test.flash('info')
  //         test.done()
  //     })
  // },

  // 'POST create fail': function (test) {
  //     var post = new ValidAttributes
  //     var create = Post.create
  //     Post.create = sinon.spy(function (data, callback) {
  //         test.strictEqual(data, post)
  //         callback(new Error, post)
  //     })
  //     test.post('/posts', {Post: post}, function () {
  //         test.success()
  //         test.render('new')
  //         test.flash('error')
  //         test.done()
  //     })
  // },

  // 'PUT update': function (test) {
  //     Post.find = sinon.spy(function (id, callback) {
  //         test.equal(id, 1)
  //         callback(null, {id: 1, updateAttributes: function (data, cb) { cb(null) }})
  //     })
  //     test.put('/posts/1', new ValidAttributes, function () {
  //         test.redirect('/posts/1')
  //         test.flash('info')
  //         test.done()
  //     })
  // },

  // 'PUT update fail': function (test) {
  //     Post.find = sinon.spy(function (id, callback) {
  //         test.equal(id, 1)
  //         callback(null, {id: 1, updateAttributes: function (data, cb) { cb(new Error) }})
  //     })
  //     test.put('/posts/1', new ValidAttributes, function () {
  //         test.success()
  //         test.render('edit')
  //         test.flash('error')
  //         test.done()
  //     })
  // },

  // 'DELETE destroy': function (test) {
  //     test.done()
  // },

  // 'DELETE destroy fail': function (test) {
  //     test.done()
  // }
}

