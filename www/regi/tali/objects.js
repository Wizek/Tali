define(['tmpl', 'sc', 'jquery-1.5-mod']
, function(tmpl, shortcut) {
  // TODO solve this in a more universal manner
  $.ajaxSetup(
    { url: "/interact"
    , type:'POST'
    , contentType:'application/json'
    , dataType:'json'
    //, processData: function(data) {return JSON.stringify(data)}
    //, success: function(v) {console.log('XHR Success:', v)}
    //, error: function(v) {console.error('XHR Error:', v)}
  })

  // tmpl('Entry', {a:1,b:2,c:3}, function(str) {
  //   console.log("tmpl\n"+str)
  // })

  var out = {}
  var Interface = out
  out._inited = false
  out.getChildrenOf = function(id, cb) {
    var ajax = {
        url: "/interact/tali/read/"+id
      , success: cb
      , error: function(e) {
          console.error(e)
          throw new Error("[LoadError] interact")
        }
    }
    $.ajax(ajax)
  }
  var _cachedEntries = out._cachedEntries = {
    '0': {
      attach: function(entry) {
        entry.getHtml(function(str) {
          var $domElem = $(str)
          $domElem.appendTo($('ul#mainTree'))
          entry.domElem = $domElem
          cache(entry)
        })
      }
    }
  }
  out.cache = function(entry) {
    if (entry.domElem) {
      this._cachedEntries[entry.id] = entry
    }else{
      entry.getHtml(function(str) {
        var $domElem = $(str)
        entry.domElem = $domElem
        this._cachedEntries[entry.id] = entry
      })
    }
  }

  // places the content of out.fn into global
  out.bloat = function() {
    var fn = this.fn
    //for (key in fn) if (fn.hasOwnProperty(key)) {
    //  if (window[key]) {
    //    var e = "Some global Interface elements are already defined,"
    //      + " preventing overwrites: aborting .bloat() processes."
    //    throw new Error(e)
    //  }
    //}
    for (key in fn) if (fn.hasOwnProperty(key)) {
      window[key] = fn[key]
    }
    return true
  }
  // Removes global objects
  out.unBloat = function() {
    var fn = this.fn
    //for (key in fn) if (fn.hasOwnProperty(key)) {
    //  if (typeof window[key] != typeof fn[key]) {
    //    var e = "Interesting things happened to bloated global Interface elements."
    //      + " Aborting .unBloat() processes."
    //    throw new Error(e)
    //  }
    //}
    for (key in fn) if (fn.hasOwnProperty(key)) {
      delete window[key]
    }
    return true
  }
  // Makes sure DOM is initialised
  out.init = function(cb) {
    if ('function' != typeof cb) {
      console.warn('.init(cb) not function.')
      cb = function() {}
    }
    var error = null
    if (this._inited) return cb(Error('Interface is .init()\'d already.'))
    this._inited = true
    var $mcc = $('<div id="mainContentContainer"/>').appendTo($('body'))
    $mTree = $('<ul id="mainTree"></ul>').appendTo($mcc)

    tmpl('FakeStructure', function(str) {
      $mTree.append(str)
      afterDownloadComplete()
    })
    //this.getChildrenOf(0, function(r) {
    //  console.log(JSON.stringify(r, null, 2))
    //  for (var i = 0; i < r.length; i++) {
    //    var c = r[i]
    //    $(c.headline).appendTo('<span class="headline">').appendTo()
    //    $mTree.append('<li><span class="headline">'+c.headline+'</span></li>')
    //  }
    //  cb(error)
    //})
    function afterDownloadComplete () {
      $('.entry_container:not(:has(.entry_children))').addClass('empty')
      Focus._only($('.entry_container:first'))
      Interface._closeAllEntries()
      $('.entry_children').slideUp()
      cb(error)
    }
    this._bindKeys()
    return true
  }
  out._bindKeys = function() {
    var Focus = this.fn.Focus
    var shrtcts = {
        'up': function() {
          Focus.go().up()
        }
      , down: function() {
          Focus.go().down()
        }
      , 'shift+up': function() {
          Focus.go().flatUp()
        }
      , 'shift+down': function() {
          Focus.go().flatDown()
        }
      , left: function() {
          Focus.go().outwards()
        }
      , right: function() {
          Focus.go().inwards()
        }
      , space: function() {
          Focus.toggle()
        }
    }
    for (key in shrtcts) if (shrtcts.hasOwnProperty(key)) {
      shortcut.add(key, shrtcts[key])
    }
  }
  out.isInited = function() {
    return this._inited
  }
  out.fn = {}
  out.fn.Interface = out
  out.fn.Mode = function() {
    throw new Error('__unimplemented__')
  }
  out.fn.Focus = (function() {
    var out = {}
    var Focus = out // so that inners can access this as well
    out.get = function() {
      return $('.focused')
    }
    out._only = function(there) {
      if (there) {
        if (there.selector) {
          // Assuming jQuery object
          Focus.get().removeClass('focused')
          there.addClass('focused')
          var $parent = there.parent().closest('.entry_container')
          if ($parent.is('.closed')) {
            $parent.removeClass('closed').addClass('open')
              .children('.entry_children').slideDown()
          }
          $(/*'html,*/'body').stop()
          .animate(
              { scrollTop: there.offset().top - ($(window).height() * 5 / 12) }
            , { duration: 'fast', easing: 'swing' }
          )
          return there
        }else{
          throw new Error('__unimplemented__')
        }
      }else{
        return false
      }
    }
    out.reset = function() {
      this._only($('.entry_container').eq(0))
    }
    //out.goFlat = function(there) {
    //  var goFlat = {}
    //  goFlat.up = function() {
    //    // TODO speed this up with caching
    //    if ($f().prev().length) {
    //      if ($f().prev().find('.entry_container:last')) {
    //        Focus._only($f().prev().find('.entry_container:last'))
    //      }else{
    //        Focus._only($f().prev())
    //      }
    //    }
    //  }
    //  return goFlat
    //}
    out.close = function() {
      Focus.get().removeClass('open').addClass('closed')
        .children('.entry_children').slideUp()
    }
    out.open = function() {
      Focus.get().removeClass('closed').addClass('open')
        .children('.entry_children').slideDown()
    }
    out.toggle = function() {
      Focus.get().toggleClass('open closed')
        .children('.entry_children').slideToggle()
    }
    out.go = function(there) {
      var out = {}
        , $f = Focus.get
      
      out.flatUp = function() {
        // TODO speed this up with caching
        // var $f_p = $f().prev()
        // if ($f_p.length) {
        //   if ($f_p.find('.entry_container:last')) {
        //     Focus._only($f_p.find('.entry_container:last'))
        //   }else{
        //     Focus._only($f_p)
        //   }
        // }
      } 
      out.flatDown = function() {
      }
      out.up = function() {
        if ($f().prev().length) {
          Focus._only($f().prev())
        }
        return this
      }
      out.down = function(n) {
        if ($f().next().length) {
          Focus._only($f().next())
        }
        return this
      }
      out.inwards = function() {
        if ($f().find('.entry_container:first').length) {
          console.log(!$f().is(':visible'))
          if (!$f().is(':visible')) {
            Focus.open()
          }
          Focus._only($f().find('.entry_container:first'))
        }
        return this
      }
      out.outwards = function() {
        if ($f().parent().closest('.entry_container').length) {
          Focus._only($f().parent().closest('.entry_container'))
        }
        return this
      }

      Focus._only(there)
      return out
    }
    return out
  })()
  // Object for managing anything directly related to a particular headline or it's body
  out.fn.Entry = function Entry(obj) {
    for (key in obj) if (obj.hasOwnProperty(key)) {
      this[key] = obj[key]
    }
    this._new = true
    this.isNew = function() {
      return this._new
    }
    this.attachTo = function(id) {
      _new = false
      _cachedEntries[id].attach(this)
      return true
    }
    // FixMe doesn't actually work for other than 0 id'd elements.
    this.attach = function(entry) {
      entry.getHtml(function(str) {
        var $domElem = $(str)
        $domElem.appendTo(this.domElem)
        entry.domElem = $domElem
        cache(entry)
      })
    }
    this.getHtml = function(cb) {
      if ('function' != typeof cb) return false
      //console.log('cb', arguments.callee.caller)
      return tmpl('Entry', this, function(str) {
        cb(str)
      })
    }
    console.log(this)
    _cachedEntries[this.id] = this
  }
  out._openAllEntries = function() {
    $('.entry_container:not(.empty)')
      .removeClass('closed')
      .addClass('open')
    $('.entry_children')
      .slideDown()
  }
  out._closeAllEntries = function() {
    $('.entry_container:not(.empty)')
      .removeClass('open')
      .addClass('closed')
    $('.entry_children')
      // FIXME Why doesn't this work with .slideUp() when $.fx.off == true ??
      .hide()
  }
  // TODO remove (debug purpose)
  window.I = out
  return out
})