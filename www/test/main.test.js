require.config({
    baseUrl: '/js'
  , packagePaths: '/asdasd'
  , paths: {
        jquery: 'https://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min'
      , order: '/lib/require/plugins/order'
      , text: '/lib/require/plugins/text'
      , qunit: '/lib/qunit/qunit'
    }
})

document.title = 'WIP'
//QUnit.config.autostart = false

define(['jquery'], function($) {
  console.log('cp 4')

  initQU(function() {
    test("a basic test example", function() {
      ok( true, "this test is fine" );
      var value = "hello";
      equal( value, "hello", "We expect value to be hello" );
    });

    module("Module A");

    test("first test within module", function() {
      ok( true, "all pass" );
    });

    test("second test within module", function() {
      ok( true, "all pass" );
    });

    module("Module B");

    test("some other test", function() {
      expect(2);
      equal( true, 2, "failing test" );
      equal( true, true, "passing test" );
    });
  })
})

function initQU (cb) {
  require(['text!/tpl/qunit.tpl', 'text!/lib/qunit/qunit.css', 'qunit']
    , function(tpl, css) {
    //console.log(asd)
    //console.log(QUnit)
    $('head').append('<style type="text/css">'+css+'</style>')
    $('body').append(tpl)
    // Workaround to make async loading of QUnit work
    QUnit.load()
    QUnit.init()
    cb()
  })
}

// Little optimization for speed
var preloadScripts = [
    'order!jquery'
  , 'order!qunit'
  , 'order!/lib/jquery.cookie.js'
]

require(preloadScripts)


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