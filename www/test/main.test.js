require.config({
    baseUrl: '/js'
  , paths: {
        'jquery': 'https://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min'
      , 'order': '/lib/require/plugins/order'
      , 'text': '/lib/require/plugins/text'
      , 'qunit': '/lib/qunit/qunit'
      , '_': 'http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.1.7/underscore-min'
      , 'Interface': 'Interface'
      , 'jquery.cookie': '/lib/jquery.cookie'
      , 'socketio': '/socket.io/socket.io'
      //, 'socket.amd': ''
    }
})

require(['jquery','./tree.js'], function($, tree) {
  tree.branch('io.amd - AMD compliant socket.io', function(tree) {
    tree(window.io).type('undefined')
    require(['io.amd'], function(ioRecieved) {
      tree(ioRecieved).type('object')
      tree(window.io).type('undefined')
      tree.done(3)
    })
  })

  tree.branch('socket.amd - Returns the socket', function(tree) {
    tree(window.socket).type('undefined')
    tree(window.io).type('undefined')
    require(['socket.amd'], function(socket) {
      tree(socket).type('object')
      tree(window.io).type('undefined')
      tree.done(4)
    })
  })

  tree.branch('Setting, getting cookies', function(tree) {
    tree.expect(6)
    require(['cookie'], function(cookie) {
      tree(cookie).type('function')
      tree(cookie('testfoo')).eql(null)
      tree(cookie('testfoo', '123431')).eql('testfoo=123431')
      tree(cookie('testfoo')).eql('123431')
      tree(cookie('testfoo', null)).ok()
      tree(cookie('testfoo')).eql(null)
      tree.done()
    })
  })

  tree.branch('Generating, setting, getting envId', function(tree) {
    tree.expect(13)
    tree(typeof conn).eql('undefined')
    require(['connect', 'cookie'], function(conn, cookie) {
      // safe to hide from overriding
      var safe = {}
      safe._get = conn.getEnvId._get
      safe._genEnvId = conn.getEnvId._genEnvId
      safe.eidCookie = cookie('eid')
      cookie('eid', null)
      // Existance check
      tree(typeof conn).eql('function')
      tree(typeof conn.getEnvId).eql('function')
      tree(typeof conn.getEnvId._get).eql('function')
      tree(typeof conn.getEnvId._set).eql('function')
      tree(typeof conn._connect).eql('function')
      tree(typeof conn._genEnvId).eql('function')
      eid = conn._genEnvId()
      tree(typeof eid).eql('string')
      tree(eid.length).eql(48)
      // Shorter, higher level form
      tree(conn.getEnvId()).eql(conn.getEnvId()
        , 'Does double call return the same value?')
      // That is stored...
      conn.getEnvId._set(eid+'x')
      // ... shall be returned
      tree(conn.getEnvId._get()).eql(eid+'x')
      // Override
      conn.getEnvId._get = function() {return 'asdasd'}
      tree(conn.getEnvId()).eql('asdasd')
      conn.getEnvId._get = function() {return null}
      conn._genEnvId = function() {return 'fghfgh'}
      tree(conn.getEnvId()).eql('fghfgh')
      // Restore
      conn.getEnvId._get = safe._get
      conn.getEnvId._genEnvId = safe._genEnvId
      cookie('eid', safe.eidCookie)
      tree.done()
    })
  })

  tree.branch('Templating engine', function(tree) {
    tree.expect(7)
    tree(typeof tpl).eql('undefined')
    require(['template'], function(tpl) {
      tree(typeof tpl).eql('function')
      tree(typeof tpl._get).eql('function')
      tree(typeof tpl._parse).eql('function')

      var tplText = '<p id="{{ 1vF }}" class="{{ a a }}">{{ a }}</p>'

      // Safe
      var safe = {}
      safe._get = tpl._get
      // Override
      tpl._get = function(name, cb) {
        cb(tplText)
      }

      tree(tpl._parse(tplText,{a:1, '1vF':'asd'}))
        .eql('<p id="asd" class="">1</p>')
   
      tpl('test', {a:'ddd', '1vF':4344, 'a a':'f'}, function(html) {
        tree(html).eql('<p id="4344" class="f">ddd</p>')
      })
      tpl('test', function(html) {
        tree(html).eql('<p id="" class=""></p>')
      })

      // Restore
      tpl._get = safe._get
      tree.done()
    })
  })

  tree.branch('Establishing connection to back end', function(tree) {
    tree.expect(6)
    tree(typeof conn).eql('undefined')
    require(['connect'], function(conn) {
      tree(typeof conn).eql('function')
      var safe = {}
      safe._connect = conn.getEnvId._connect
      // Override
      conn._connect = function(cb) {
        return cb(null, 'testUser')
      }
      tree(conn.established).eql(false)
      conn(function(err, user) {
        tree(err).eql(null)
        tree(user).eql('testUser')
        tree(conn.established).eql(true)
        tree.done()
      })
      // Restore
      conn.getEnvId._connect = safe._connect
    })
  })

  tree.branch('Initialize Interface', function(tree) {
    tree.expect(15)
    tree(typeof I).eql('undefined')
    require(['Interface'], function(I) {
      tree(typeof I).eql('object')
      tree(typeof I.init).eql('function')
      tree(typeof I._initLogin).eql('function')
      tree(typeof I._initDoc).eql('function')
      tree($('body #tali-interface').length).eql(0)
      tree($('form#login-box').length).eql(0)
      // debugger
      I.init('login', function() {
        tree($('body #tali-interface').length).eql(0)
        tree($('form#login-box').length).eql(1)
        tree($('#username').length).eql(1)
        tree($('#password').length).eql(1)
        tree($('#loginNow').length).eql(1)
        I.init('doc', function() {
          tree($('body > #tali-interface').length).eql(1)
          tree($('form#login-box').length).eql(0)
          tree($('ul#null-node.node-conainer').length).eql(1)
          tree.done()
        })
      })
    })
  })

  tree.branch('Node retrival, processing', function(tree) {
    tree.expect(4)
    var safe = {}
    require(['Interface'], function(I) {
      tree(typeof I.getChildrenOf).eql('function')
      tree(typeof I.getChildrenOf._emit).eql('function')
      safe._emit = I.getChildrenOf._emit
      I.getChildrenOf._emit = function(id, cb) {
        cb(null, [
          {
            "id": 1,
            "headline": "#1",
            "body": "2",
            "updated_at": "2011-08-24T05:27:31.000Z",
            "created_at": "2011-08-24T05:27:31.000Z",
            "parent_id": 0,
            "childnum": 2
          }
        ])
      }
      I.getChildrenOf(0, function(err, html) {
        tree(err).eql(null)
        tree(typeof html).eql('string')
        I.getChildrenOf._emit = safe._emit
        tree.done()
      })
    })
  })

  tree.branch('Node placement', function(tree) {
    tree.expect(6)
    var safe = {}
    require(['Interface'], function(I) {
      tree(typeof I.placeAsChidrenOf).eql('function')
      safe._emit = I.getChildrenOf._emit
      I.getChildrenOf._emit = function(id, cb) {
        cb(null, $.extend(true, [], [
          {
            "id": 1,
            "headline": "headline",
            "body": "bodytext",
            "updated_at": "2011-08-24T05:27:31.000Z",
            "created_at": "2011-08-24T05:27:31.000Z",
            "parent_id": 0,
            "childnum": 2
          }
        ]))
      }
      tree($('li.node.focused').length).eql(0)
      I.getChildrenOf(0, function(err, html) {
        tree(I.placeAsChidrenOf(1, html)).eql(false)
        tree(I.placeAsChidrenOf(0, html)).eql(true)
        tree($('li.node').length).eql(1)
        tree($('li.node.focused').length).eql(1)
        I.getChildrenOf._emit = safe._emit
        tree.done()
      })
    })
  })

  tree.done(0)
})

// Little optimization for speed
var preloadScripts = [
    'order!jquery'
  // , 'order!qunit'
  // , 'order!/lib/jquery.cookie.js'
]

require(preloadScripts)