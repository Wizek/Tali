(function($){
Backbone.sync = function(method, model, success, error){ 
  console.log(method)
  console.log('asd')
  success();
}

var Item = Backbone.Model.extend({
  defaults: {
    text: '',
    position:0
  }
})

var List = Backbone.Collection.extend({
  model: Item
})

var itemView = Backbone.View.extend({
  
})

var listView = Backbone.View.extend({ 
  el: $('body')
  , events: {
    'keyup input#add': 'addItem'
    , 'click .x': 'unrender'
  }
  , initialize: function(){
    _.bindAll(this, 'render', 'unrender', 'addItem', 'insertItemBeforeFocused')
    this.collection = new List()
    this.model = this.collection.model
    this.collection.bind('add', this.insertItemBeforeFocused) // collection event binder
    this.collection.bind('remove', this.unrender) // collection event binder
    this.model.bind('change', this.render);
    this.model.bind('remove', this.unrender);
    this.render()
  }
  , render: function(){
    $(this.el)
      .append('<ul><li><input id="add" placeholder="Type here then hit Enter"></li></ul>')
  }
  , unrender: function() {
    $(this.el).remove()
  }
  , addItem: function(e){
    if (e.keyCode == 13) {
      var trgEl = $(e.target)
      if (trgEl.val() === '') {return}
      var item = new Item({text:trgEl.val()})
      trgEl.val('')
      this.collection.add(item)
    }
  }
  , deleteItemByX: function() {
    console.log(this.model)
  }
  , removeLi: function(item) {
    item.li.remove()
  }
  , appendToUl: function(item){
    $('ul', this.el).append('<li><input value="'+item.get('text')+'"></li>')
  }
  , insertItemBeforeFocused: function(item) {
    item.el = $(
      _.template('<li><input value="<%=v%>"> <span class="x">×</span></li>'
      , {v:item.get('text')}
    ))
    $('ul li:last-child', this.el).before(item.el)
    window.c = this.collection
  }
})

new listView()
})(jQuery)