define(['./shortcut.js'], function() {
  var shortcut = window.shortcut
  delete window.shortcut
  
  return shortcut
})