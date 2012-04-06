// Module for loading templates asyncronously.
define(['underscore-min'], function(underscore_salted) {
  var Tmpl = function Tmpl(name, obj, cb) {
    if ('function' == typeof obj && !cb) {
      cb = obj
      obj = {}
    }
    if ('function' != typeof cb) throw new Error('No callback!')
    return require(['text!/templates/'+name+'.tmpl'], function(t) {
      return cb(_.template(t, obj))
    })
  }
  return Tmpl
})