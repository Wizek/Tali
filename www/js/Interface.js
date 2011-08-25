define(['jquery', 'template', 'connect'], function($, tpl, conn) {
  var socket = conn.socket
  console.log(Object.keys(conn))
  var Interface, I
  Interface = I = {}
  I.init = function(what, cb) {
    if (what == "login") { I._initLogin(cb) }
    else if (what == "doc") { I._initDoc(cb) }
    else{ console.log('wat-wat-wat?!') }
  }
  I._initLogin = function(cb) {
    if (typeof cb != 'function') cb = function() {}
    //$('div#tali-interface').remove()
    I._cleanBody()
    //$login = $('<form id="login">').appendTo('body')
    tpl('login', function(html) {
      $login = $(html).appendTo('body')
      $user = $login.find('#username')
      $pass = $login.find('#password')
      $login.find('#loginNow').click(login)
      $login.keypress(function(evt) {
        // if Enter
        if (evt.keyCode == 13) {
          login()
        }
      })
      function login () {
        var user = $user.val()
        var pass = $pass.val()
        socket.emit('login', user, pass, function(err) {
          $('#loginNow').removeAttr('disabled')
          if (err) {
            alert(err)
          }else{
            I.init('doc')
          }
        })
      }
      return cb()
    })
  }
  I._initDoc = function(cb) {
    I._cleanBody()
    $interf = $('<div id="tali-interface">').appendTo('body')
  }
  I._cleanBody = function() {
    $('body > :not([id^=qunit])').remove()
  }
  return I
})