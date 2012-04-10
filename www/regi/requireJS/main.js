console.log('1st')
require(['./secondary.js', './secondary.js', './secondary.js'], function(asd, masodik, harmadik) {
  console.log('2nd', asd, masodik, harmadik)
})