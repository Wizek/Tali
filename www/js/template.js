// ### Purpose:
// Async module for downloading and parsing mustache-styled template files.
// Caches interally with RequireJS (however non-tested)
//
//  - @dependencies
//    - RequireJS
//    - text!RequireJS
//  - @constructor
//    - Returns *1 public* function
//    - with *2 private* methods attached.
//  - @returns
//    - `tpl(name, [vars,] cb)`
//    - private `tpl._parse()`
//    - private `tpl._get()`
//
//  **********************************************************************

// Asyncronous Module Definition
define([], function() {
  // ### Main function
  // Top level return
  //
  //  - @api public
  //  - @params
  //    - **`name`** *{string}* Name of the template file
  //    - [**`vars`**] *{object}* Varialbes to be placed into the template
  //    - **`cb`** *{function}* Callback
  //  - @callbackReceives
  //    - **`text`** *{string}* Parsed template HTML string
  var tpl = function(name, vars, cb) {
    if (typeof name != 'string')
      return console.error('That won\'t work without a name!')
    if (typeof vars == 'function' && typeof cb != 'function')
      cb = vars
    if (typeof vars != 'object')
      vars = {}
    if (typeof cb != 'function')
      return console.error('No callback given, aborting!')
    tpl._get(name, function(text) {
      var rendered = tpl._parse(text, vars)
      cb(rendered)
    })
  }
  //  - @api private
  tpl._parse = function(txt, vars) {
    return txt.replace(/{{\s*([^}]*?)\s*}}/g
    , function(match, group, pos, oStr) {
      if (group in vars) {
        return vars[group]
      }else{
        return '' 
      }
    })
  }
  //  - @api private
  tpl._get = function(name, cb) {
    require(['text!/tpl/'+name+'.tpl'], function(txt) {
      cb(txt)
    })
  }
  return tpl
})