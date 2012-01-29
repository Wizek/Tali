// ### Purpose:
// Yet to be outlined.
//
//  - @dependencies
//  - @constructor
//  - @returns
//
//  **********************************************************************

// Asyncronous Module Definition
define(['jquery', 'template'], function($, tpl) {
  
  var Interface, I
  Interface = I = {}

  I.init = function(what, cb) {
    if (what == "login") { I._initLogin(cb) }
    else if (what == "doc") { I._initDoc(cb) }
    else { console.log('wat-wat-wat?!') }
  }

  I._initLogin = function(cb) {
    if (typeof cb != 'function') cb = function() {}
    //$('div#tali-interface').remove()
    I._cleanBody()
    //$login = $('<form id="login">').appendTo('body')
    tpl('login', function(html) {
      $login = $(html).appendTo('body')
      $login.find('#loginNow').click(function() {
        I._initLogin._login($login)
      })
      $login.keypress(function(evt) {
        // if Enter
        if (evt.keyCode == 13) {
          I._initLogin._login($login)
        }
      })
      return cb()
    })
  }

  I._initLogin._login = function ($login) {
    $user = $login.find('#username')
    $pass = $login.find('#password')
    var user = $user.val()
    var pass = $pass.val()
    I._initLogin._login._emit(user, pass, function(err) {
      $('#loginNow').removeAttr('disabled')
      if (err) {
        alert(err)
      } else {
        I.init('doc')
      }
    })
  }

  I._initLogin._login._emit = function(user, pass, cb) {
    require(['socket.amd'], function(socket) {
      socket.emit('login', user, pass, function(err) {
        cb(err)
      })
    })
  }

  I._initDoc = function(cb) {
    if (typeof cb != 'function') cb = function() {}
    I._cleanBody()
    $interf = $('<div id="tali-interface">').appendTo('body')
    $interf.append('<ul id="null-node" class="node-conainer">')
    cb()
  }

  I._cleanBody = function() {
    $('body > :not(.tree-top)').remove()
  }

  I.getChildrenOf = function(id, cb) {
    I.getChildrenOf._emit(id, function(err, results) {
      if (err) {
        return cb(err)
      } else {
        var counter = results.length
        var htmlResults = []
        require(['template'], function(tpl) {
          for (var i = 0; i < results.length; i++) {
            (function(i) {
              tpl('node', results[i], function(html) {
                htmlResults[i] = html
                done()
              })
            })(i)
          }
        })
        function done () {
          if (--counter) return
          return cb(err, htmlResults.join(''))
        }
      }
    })
  }

  I.getChildrenOf._emit = function(id, cb) {
    require(['socket.amd'], function(socket) {
      socket.emit('get children of', id, function(err, results) {
        return cb(err, results)
      })
    })
  }

  // Replaces old children with new ones completely
  I.placeAsChidrenOf = function(id, html) {
    if (id == 0) {
      $('#null-node').html(html)
      $('.focused').removeClass('focused')
      $('li.node').eq(0).addClass('focused')
      return true
    } else {
      var $parent = $('[node-id='+id+']')
      if ($parent.length) {
        // We have the parent
        $parent.children('ul.node-container').html(html)
        return true
      } else {
        // No parent to place the child
        return false
      }
    }
  }

  return I
})