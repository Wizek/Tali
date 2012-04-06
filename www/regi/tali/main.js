// Modules of which each needs to load before testing can begin proper
var requisits = [
    './objects.js'
  , 'jquery-1.5-mod'
]

// Actual loading 
define(requisits, function(Interface) {
  //Interface = Interface() // Why the hell is this needed?
  $(init)
  function init () {
    Interface.bloat()
    Interface.init()
  }
})

// Start these downloads in the bacground without blocking,
// they'll be needed later on.

var deferredPlugins = [
    'text'
  , 'order'
  , 'tmpl'
  , 'sc'
  , 'underscore-min'
]

require(
  new Array().concat(deferredPlugins)
)