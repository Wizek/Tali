$(function(){

// $('[contenteditable]').live('focus', function() {
//     var $this = $(this);
//     $this.data('before', $this.html());
//     return $this;
// }).live('blur keyup paste', function() {
//     var $this = $(this);
//     if ($this.data('before') !== $this.html()) {
//         $this.data('before', $this.html());
//         $this.trigger('change');
//     }
//     return $this;
// });

Backbone.sync = function(method, model, success, error){ 
  console.log(method)
  console.log('asd')
  success();
}

var Item = Backbone.Model.extend({
  defaults: {
    text: ''
    , position:0
  }
})

var List = Backbone.Collection.extend({
  model: Item
})


window.itemView = Backbone.View.extend({
  tagName: 'li'
  , events: {
    // 'change':'enter'
    'mouseover input':'enter'
  }
  , initialize: function() {
    console.log('init')
    // _.bindAll(this, 'enter')
    this.render()
  }
  , render: function() {
    console.log('render')
    $('body').append('<li><input></li>')
  }
  , enter: function(e) {
    // console.log(e.stopPropagation())
    if (e.keyCode == 13) {
      console.log('enter', new itemView())
    }
    // return false
  }
})

new itemView()

// var listView = Backbone.View.extend({ 
//   el: $('body')
//   , events: {
//     'keyup input#add': 'addItem'
//     , 'click .x': 'unrender'
//   }
//   , initialize: function(){
//     _.bindAll(this, 'render', 'unrender', 'addItem', 'insertItemBeforeFocused')
//     this.collection = new List()
//     this.model = this.collection.model
//     this.collection.bind('add', this.insertItemBeforeFocused) // collection event binder
//     this.collection.bind('remove', this.unrender) // collection event binder
//     this.model.bind('change', this.render);
//     this.model.bind('remove', this.unrender);
//     this.render()
//   }
//   , render: function(){
//     $(this.el)
//       .append('<ul><li><input id="add" placeholder="Type here then hit Enter"></li></ul>')
//   }
//   , unrender: function() {
//     $(this.el).remove()
//   }
//   , addItem: function(e){
//     if (e.keyCode == 13) {
//       var trgEl = $(e.target)
//       if (trgEl.val() === '') {return}
//       var item = new Item({text:trgEl.val()})
//       trgEl.val('')
//       this.collection.add(item)
//     }
//   }
//   , deleteItemByX: function() {
//     console.log(this.model)
//   }
//   , removeLi: function(item) {
//     item.li.remove()
//   }
//   , appendToUl: function(item){
//     $('ul', this.el).append('<li><input value="'+item.get('text')+'"></li>')
//   }
//   , insertItemBeforeFocused: function(item) {
//     item.el = $(
//       _.template('<li><input value="<%=v%>"> <span class="x">×</span></li>'
//       , {v:item.get('text')}
//     ))
//     $('ul li:last-child', this.el).before(item.el)
//     window.c = this.collection
//   }
// })

// new listView()
})