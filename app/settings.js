/*\
 *  Module for handling server settings
\*/
var fs = require('fs')

var settings = fs.readFileSync('settings.json', 'utf8')
settings = JSON.parse( settings.replace(/\n?\s*\/\/.*/g,'') )

module.exports = settings