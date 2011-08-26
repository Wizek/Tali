// amd test code
define([], function() {
  console.log('called!')
  if (typeof o == 'undefined') {
    var o = {a:1}
  }
  o.a++
  return o
})