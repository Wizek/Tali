/*\
 *  General helper functions, extending arbitrary javascript
\*/

// WOW! Just wow!...
Object.defineProperty(Object.prototype, '_proto',
  { enumerable: false
  , writable: true
  , value: function(name, fn) {
      Object.defineProperty( this.prototype, name, 
        { enumerable: false
        , writable: true
        , value: fn } )
    }
  }
)
// v2?: Can I haz something simmilar tho this:
// Object._proto.selectKeys = function() {}

// Returns a new object with the specified keys only
Object._proto('selectKeys', function () {
  var a = arguments
    , newObj = {}
  for (var i = 0; i < a.length; i++) {
    newObj[a[i]] = this[a[i]]
  }
  return newObj
})

// Checks if given value is present within an Array.
Array._proto('has', function(check) {
  var ary = this
  for (var i = ary.length - 1; i >= 0; i--) {
    if (ary[i] === check) {
      return true
    }
  }
  return false
})

// Removes all the occurances of a given value from an array
// and returns the number of removal.
Array._proto('pull', function(a) {
  var ary = this
    ,  c = 0 // How many removal happened // Ahány törlés történt
  for (var i = ary.length - 1; i >= 0; i--) {
    if (ary[i] === a) {
      ary.splice(i, 1)
      c++
    }
  }
  return c
})

// Escapes strings to be suitable for SQL querying.
String._proto('esc', function() {
  return "'" + this.replace(/'/g,"\\'") + "'"
})

// TODO instead http://jacwright.com/projects/javascript/date_format
Date._proto('format', function(type) {
  var self = this
    , formats = {
          time: function() {return self.toJSON().replace(/^.*T|\.\d{3}Z$/g,'')}
        , date: function() {return self.toJSON().replace(/T.*Z/,'')}
        , fallback: function() {
            return self.toJSON()
              .replace(/-/g,'-').replace('T',' ').replace(/\.\d{3}Z$/,'')
          }
      }
  if (type in formats) {
    return formats[type]()
  }else{
    return formats.fallback()
  }
  
})


/*\
 *  Response object extensions
\*/

exports.res = {
    doSendFile: function (path) {
      var res = this
      var fullPath = './www'+path
      return res.sendfile(fullPath)
    }
  , invalid: function () {
      var res = this
        , req = res.req
      var s = ""
        , out = {details:{}}
      //if (typeof s == 'string') {
      //  s = " "+s
      //}else if (typeof s == 'number') {
      //  s = " #"+s
      //}else{
      //  s = ""
      //}
      out.error = "Invalid JSON request"+s+"!"
      out.details.url = req.url
      out.details.body = req.body
      return res.send(out, 400)
    }
    
  , ___notFinished___: function (req, res, next) {
      var s = ""
      //if (typeof a == 'string') {
      //  s = " ("+a+")"
      //}else if (typeof a == 'number') {
      //  s = " #"+a
      //}
      console.error("ERROR: Unfinished area"+s+" requested!")
      return res.send({'error':'You have ventured into an unfinished area!'+s}, 501)
    }
}
    
/*\
 *  Server-specific helper functions
\*/

exports.color = function(str, color, col2) {
  var colorStamp = (color||'') + (col2? ';'+col2 : '')
  if (colorStamp) {
    return '\033[' + colorStamp + 'm' + str + '\033[0;0;0m'
  }else{
    return str
  }
}

exports.colorfulLoggerFn = function(logger, req, res, format) {
  console.log('arg',arguments)
  //    console.log(req.header('host')) //////////////////////////////////
  var color = exports.color
  var colors = { 404: 33, 500: 31 } // TODO: implement for more statcodes
    , code = colors[res.statusCode]? colors[res.statusCode]+';1' : 32
    , rt = res.responseTime
    // responseTimeColor
    , rtc =
        rt < 5  ? 32  // green
      : rt < 15 ? 37  // grey
      : rt < 50 ? 33  // yellow
      : 31            // red
    , rt =
        rt < 10 ? "  "+rt
      : rt < 100 ? " "+rt
      : rt
    , rfr = req.header('referer')
  // remove host if unnesecary to show (self)
  rfr = rfr ? rfr.replace('http://'+req.header('host'),'') : ''

  return format(
    new Date().format()
    + color(' '+rt, rtc)+'ms'
    + color(' :remote-addr')
    + color(' :status',code)
    + color(' :method',37)
    + color(' ('+rfr+')>',33)
    + color(' :url',1)
  )
}

/*\
 *  Queueing
\*/

exports.Queue = function() {
  return {
      add: function(fn) {
        var s = this._stack
        if (typeof fn == "function") {
          s.push(fn)
        }else{
          var a = fn
          s.push(function(next) {
            console.log(a)
            var args = Array.prototype.slice.call(arguments).slice(1)
            next.apply(null, args)
          })
        }
      }
    , _next: function() {
        if (!this._stack.length) return
        var args = Array.prototype.slice.call(arguments)
          , t = this
        args.unshift(function() { return t._next.apply(t, arguments); })
        this._stack.shift().apply(null, args)
      }
    , run: function() { this._next() }
    , _stack: []
  }
}

/* Extend function, improved. */
exports.extend = function extend(subClass, superClass) {
  var F = function() {};
  F.prototype = superClass.prototype;
  subClass.prototype = new F();
  subClass.prototype.constructor = subClass;
  subClass.superclass = superClass.prototype;
  if(superClass.prototype.constructor == Object.prototype.constructor) {
    superClass.prototype.constructor = superClass;
  }
}

/* TODO Maybe not the best, but working */
exports.asyncCbChecker = function(runGoal, cb) {
  this.cbCounter = 0
  this.cbReal = cb
  this.cbRunGoal = runGoal
  this.argumentStore = []
  var that = this
  this.cb = function(err) {
    that.cbCounter++
    for (var i = 0, len = arguments.length; i < len; i++) {
      if (that.argumentStore[i]) {
        that.argumentStore[i].push(arguments[i])
      } else {
        that.argumentStore[i] = [arguments[i]]
      }
    }
    if (that.cbCounter >= that.cbRunGoal) {
      for (var i = 0, len = that.argumentStore.length; i < len; i++) {
        var allNull = true
        for (var j = 0, len1 = that.argumentStore[i].length; j < len1; j++) {
          if (that.argumentStore[i][j] != null) {
            allNull = false
          }
        }
        if (allNull) {
          that.argumentStore[i] = null
        }
      }
      return that.cbReal.apply(null, that.argumentStore)
    }
  }
  return this.cb
}

exports.cookiesToObject = function(cookies) {
  cookieArray = cookies.split(';')
  cookieObj = {}
  for (var i = 0, len = cookieArray.length; i < len; i++) {
    cookieData = cookieArray[i].split('=')
    cookieObj[cookieData[0]] = cookieData[1]
  }
  return cookieObj
}
