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

document.title = 'WIP'
//QUnit.config.autostart = false

require(['jquery'], function($) {

  initQU(function() {
    module('Entry')

    // test('', function() {
    //   expect(-1)
    // })

    /*
    test('amd', function() {
      require(['amd'], function(o) {
        console.log(o.counter)
        o.counterPlusOne()
        console.log(o.counter)
      })

        console.log(1, JSON.stringify(o))
        o.a++
        console.log(1.5, JSON.stringify(o))
        require(['amd'], function(o) {
          console.log(2, JSON.stringify(o))
        })
      })
      require(['amd'], function(o) {
        console.log(3, JSON.stringify(o))
        require(['amd'], function(o) {
          o.asd = 'asd'
          console.log(4, JSON.stringify(o))
        })
      })
      require(['amd'], function(o) {
        console.log(5, JSON.stringify(o))
        require(['amd'], function(o) {
          console.log(6, JSON.stringify(o))
        })
      })
    })
      */

    test('io.amd - AMD compliant socket.io', function() {
      expect(3)
      equal(typeof window.io, 'undefined')
      stop(1000)
      require(['io.amd'], function(ioRecieved) {
        start()
        equal(typeof ioRecieved, 'object')
        //equal(Object.keys(ioRecieved.sockets).length, 0
        //  , 'We shouldn\'t have made connections just yet')
        equal(typeof window.io, 'undefined')
      })
    })

    test('socket.amd - Returns the socket', function() {
      expect(4)
      equal(typeof socket, 'undefined', 'asd')
      equal(typeof io, 'undefined')
      stop(1000)
      require(['socket.amd'], function(socket) {
        start()
        equal(typeof socket, 'object')
        equal(typeof window.io, 'undefined')
      })
    })

    test('Setting, getting cookies', function() {
      expect(6)
      stop(1000)
      require(['cookie'], function(cookie) {
        start()
        equal(typeof cookie, 'function')
        equal(cookie('testfoo'), null)
        equal(cookie('testfoo', '123431'), 'testfoo=123431')
        equal(cookie('testfoo'), '123431')
        ok(cookie('testfoo', null))
        equal(cookie('testfoo'), null)    
      })
    })

    test('Generating, setting, getting envId', function() {
      expect(13)
      equal(typeof conn, 'undefined')
      stop(1000)
      require(['connect', 'cookie'], function(conn, cookie) {
        start()
        
        // safe to hide from overriding
        var safe = {}
        safe._get = conn.getEnvId._get
        safe._genEnvId = conn.getEnvId._genEnvId
        safe.eidCookie = cookie('eid')
        cookie('eid', null)

        // Existance check
        equal(typeof conn, 'function')
        equal(typeof conn.getEnvId, 'function')
        equal(typeof conn.getEnvId._get, 'function')
        equal(typeof conn.getEnvId._set, 'function')
        equal(typeof conn._connect, 'function')
        equal(typeof conn._genEnvId, 'function')

        eid = conn._genEnvId()
        equal(typeof eid, 'string')
        equal(eid.length, 48)

        // Shorter, higher level form
        equal(conn.getEnvId(), conn.getEnvId()
          , 'Does double call return the same value?')
        // That is stored...
        conn.getEnvId._set(eid+'x')
        // ... shall be returned
        equal(conn.getEnvId._get(), eid+'x')


        
        // Override
        conn.getEnvId._get = function() {return 'asdasd'}
        equal(conn.getEnvId(), 'asdasd')
        conn.getEnvId._get = function() {return null}
        conn._genEnvId = function() {return 'fghfgh'}
        equal(conn.getEnvId(), 'fghfgh')

        // Restore
        conn.getEnvId._get = safe._get
        conn.getEnvId._genEnvId = safe._genEnvId
        cookie('eid', safe.eidCookie)
      })
    })

    test('Templating engine', function() {
      expect(7)
      stop(100)
      equal(typeof tpl, 'undefined')
      require(['template'], function(tpl) {
        start()
        equal(typeof tpl, 'function')
        equal(typeof tpl._get, 'function')
        equal(typeof tpl._parse, 'function')

        var tplText = '<p id="{{ 1vF }}" class="{{ a a }}">{{ a }}</p>'

        // Safe
        var safe = {}
        safe._get = tpl._get
        // Override
        tpl._get = function(name, cb) {
          cb(tplText)
        }

        equal(tpl._parse(tplText, {a:1, '1vF':'asd'})
          , '<p id="asd" class="">1</p>')
        
        tpl('test', {a:'ddd', '1vF':4344, 'a a':'f'}, function(html) {
          equal(html, '<p id="4344" class="f">ddd</p>')
        })
        tpl('test', function(html) {
          equal(html, '<p id="" class=""></p>')
        })

        // Restore
        tpl._get = safe._get
      })
    })

    test('Establishing connection to back end', function() {
      expect(6)
      equal(typeof conn, 'undefined')
      stop(1000)
      require(['connect'], function(conn) {
        start()
        equal(typeof conn, 'function')
        var safe = {}
        safe._connect = conn.getEnvId._connect

        // Override
        conn._connect = function(cb) {
          return cb(null, 'testUser')
        }

        equal(conn.established, false)
        stop(1000)
        conn(function(err, user) {
          start()
          equal(err, null)
          equal(user, 'testUser')
          equal(conn.established, true)
        })

        // Restore
        conn.getEnvId._connect = safe._connect
      })
    })

    test('Initialize Interface', function() {
      expect(15)
      equal(typeof I, 'undefined')
      stop(1000)
      require(['Interface'], function(I) {
        start()
        equal(typeof I, 'object')
        equal(typeof I.init, 'function')
        equal(typeof I._initLogin, 'function')
        equal(typeof I._initDoc, 'function')

        equal($('body #tali-interface').length, 0)
        equal($('form#login-box').length, 0)
        stop(1000)
        I.init('login', function() {
          start()
          equal($('body #tali-interface').length, 0)
          equal($('form#login-box').length, 1)
          equal($('#username').length, 1)
          equal($('#password').length, 1)
          equal($('#loginNow').length, 1)
          stop(1000)
          I.init('doc', function() {
            start()
            equal($('body > #tali-interface').length, 1)
            equal($('form#login-box').length, 0)
            equal($('ul#null-node.node-conainer').length, 1)
            
          })
        })
      })
    })


    test('Node retrival, processing', function() {
      expect(4)
      var safe = {}
      stop(1000)
      require(['Interface'], function(I) {
        start()
        equal(typeof I.getChildrenOf, 'function')
        equal(typeof I.getChildrenOf._emit, 'function')

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
        stop(1000)
        I.getChildrenOf(0, function(err, html) {
          start()
          equal(err, null)
          equal(typeof html, 'string')
          I.getChildrenOf._emit = safe._emit
        })
      })
    })
    
    test('Node placement', function() {
      expect(6)
      var safe = {}
      stop(1000)
      require(['Interface'], function(I) {
        start()
        equal(typeof I.placeAsChidrenOf, 'function')
        safe._emit = I.getChildrenOf._emit
        I.getChildrenOf._emit = function(id, cb) {
          cb(null, $.extend(true, [], [
            {
              "id": 1,
              "headline": "#1",
              "body": "2",
              "updated_at": "2011-08-24T05:27:31.000Z",
              "created_at": "2011-08-24T05:27:31.000Z",
              "parent_id": 0,
              "childnum": 2
            }
          ]))
        }
        equal($('li.node.focused').length, 0)
        I.getChildrenOf(0, function(err, html) {
          equal(I.placeAsChidrenOf(1, html), false)
          equal(I.placeAsChidrenOf(0, html), true)
          equal($('li.node').length, 1)
          equal($('li.node.focused').length, 1)
          I.getChildrenOf._emit = safe._emit
        })
      })
    })
    
  })
})

function initQU (cb) {
  require(['text!/tpl/qunit.tpl', 'text!/lib/qunit/qunit.css']
    , function(tpl, css) {
    $('head').append('<style type="text/css">'+css+'</style>')
    $('body').append(tpl)
    require(['qunit'], function() {
      // Workaround to make async loading of QUnit work
      // if (!$('#qunit-filter-pass').length) {
      //   QUnit.load() 
      // }
      QUnit.load() 
      QUnit.init()
      start()
      return cb()  
    })
  })
}

// Little optimization for speed
var preloadScripts = [
    'order!jquery'
  // , 'order!qunit'
  // , 'order!/lib/jquery.cookie.js'
]

// require(preloadScripts)


/*define(['js!/socket.io/socket.io.js'], function(io) {
  define('respasff')

  var socket = io.connect('http://localhost')
  socket.on('news', function (data) {
    console.log(socket.socket.sessionid)
    socket.emit('my other event', "{ my: 'data' }")
  })
  socket.on('disconnect', function() {
    console.log('DC')
  })
  socket.on('connecting', function() {
    console.log('reC')
  })
  for (var i = 0; i < 1; i++) {
    console.log(genToken())
  }
  function genToken () {
    var token = ''
    var loops = 8
    var targetLength = 48
    var useOfRandom = Math.pow(2,31)
    while (token.length <= targetLength) {
      token += (Math.random()*useOfRandom|0).toString(36)
    }
    return token.substring(0, targetLength)
  }
})
*/

/*<!DOCTYPE html>
<html>
<head>
  <title>WIP</title>
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js"></script>
  <script src="/lib/jquery.cookie.js"></script>
  <script src="/socket.io/socket.io.js"></script>
  <script>
    var g = {}
    g.domReady = false
    g.connReady = false
    getEnvID() // Just so we save those microseconds too!
    var socket = io.connect(location.origin)
    socket.on('connect', function () {
      socket.emit('set envId', getEnvID().token, function(err, user) {
        g.connReady = true
        onConnectionReady()
        if (user) {
          loggedIn()
        }
        // #16
      })
    })
    $(onDomReady)
    function onDomReady () {
      g.domReady = true
      bothReady()
      if (!g.connReady) {
        $('#loginBox input').attr('disabled', true)
      }
      //$('body').html(null)
      $('#loginNow').click(login)
      $('#loginBox').keypress(function(evt) {
        // if Enter
        if (evt.keyCode == 13) {
          login()
        }
      })
      function login () {
        $('#loginNow').attr('disabled', true)
        var user = $('#username').val()
        var pass = $('#password').val()
        socket.emit('login', user, pass, function(err) {
          $('#loginNow').removeAttr('disabled')
          if (err) {
            alert(err)
          }else{
            loggedIn()
          }
        })
      }
    }
    function onConnectionReady () {
      bothReady()
    }
    function bothReady () {
      if (!g.domReady || !g.connReady) return
      $('#loginBox input').removeAttr('disabled')

      getChildrenOf(0)
    }
    function loggedIn () {
      $('form#loginBox').hide()
    }
    
    function getEnvID (argument) {
      var eID = $.cookie('eID')
      var first = false
      if (!eID) {
        first = true
        eID = genEnvID()
        $.cookie('eID', eID, 365)
      }
      return {'first':first, 'token':eID}
    }
    function genEnvID () {
      var token = ''
      var loops = 8
      var targetLength = 48
      var useOfRandom = Math.pow(2,31)
      while (token.length <= targetLength) {
        token += (Math.random()*useOfRandom|0).toString(36)
      }
      return token.substring(0, targetLength)
    }
    function getChildrenOf (id) {
      socket.emit('get children of', id, function(err, nodes) {
        if (err) {
          console.log(err)
        }else{
          displayNodes(id, nodes)
        }
      })
    }
    function displayNodes (parent, nodes) {
      if (parent == 0) {
        for (var i = 0; i < nodes.length; i++) {
          var c = nodes[i]
          console.log(c.headline)
          $(c.headline).appendTo('<li>').appendTo('body')
          // $('body').append(c.headline)
        }
      }else{
        
      }
    }
  </script>
</head>
<body>
  <noscript><h1>Valami gond van a JavaScripteddel!</h1></noscript>
  <form id="loginBox">
    <table>
      <tr>
        <!-- <td><label for="username">Felhasználónév</label></td> -->
        <td><input id="username" type="text" placeholder="Felhasználónév"></td>
      </tr>
      <tr>
        <!-- <td><label for="password">Jelszó</label></td> -->
        <td><input id="password" type="password" placeholder="Jelszó"></td>
      </tr>
      <tr>
        <td><input id="loginNow" type="button" value="Belépek"></td>
      </tr>
    </table>
  </form>
</body>
</html>*/