var path = require('path')
  , settings = require('./settings.js')

for (var requirePath in settings.requirePaths) {
  require.paths.unshift(path.join(__dirname, '/../' + settings.requirePaths[requirePath]))
}