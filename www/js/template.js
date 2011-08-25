define([], function() {
  var tpl = function(name, vars, cb) {
    if (typeof name != 'string')
      console.error('That won\'t work without a name!')
    if (typeof vars == 'function' && typeof cb != 'function')
      cb = vars
    if (typeof vars != 'object')
      vars = {}
    if (typeof cb != 'function')
      console.error('Provide callback please!')
    tpl._get(name, function(text) {
      cb(tpl._render(text, vars))
    })
  }
  tpl._render = function(txt, vars) {
    return txt.replace(/{{\s*([^}]*?)\s*}}/g, function(match, group, pos, oStr) {
      if (group in vars) {
        return vars[group]
      }else{
        return '' 
      }
    })
  }
  tpl._get = function(name, cb) {
    require(['text!/tpl/'+name+'.tpl'], function(txt) {
      cb(txt)
    })
  }
  return tpl
})