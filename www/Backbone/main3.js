$(function(){
var MAX_VAL = Number.MAX_VALUE/2
var MIN_VAL = Number.MIN_VALUE*2
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
  console.log('sync', arguments)
  success()
}

window.Item = Backbone.Model.extend({
  _defs: {
    headline: ''
    , body: ''
    , updated_at: new Date()
    , created_at: new Date()
    , position:0
    , children:null // inserted after collection creation
  }
  defaults: function() {
    return _(_defs).extend({children:new _defs.children()})
  }
  , prevPos: function() {
    debugger
    var coll = this.collection
    var us = this.get('position')
    return coll.reduce(function(a,b) {
      var ap = a.get('position')
      var bp = b.get('position')
      console.log('ppos', arguments)
      return ap<bp && bp<us ? b:a
    }, new Item({position:-MAX_VAL}))
  }
  , before: function(a) {
    var coll = this.collection
    var pos = this.get('position')+this.prevPos()/2
    _(a).extend({position:pos})
    coll.add(a)
  }
  , after: function() {
    console.log(this, arguments)
  }
})

window.List = Backbone.Collection.extend({
  model: Item
  , append: function(v) {
    this.add(v)
  }
})

console.log(Item.prototype.defaults.children = new List)

window.list = new List()

window.ItemView = Backbone.View.extend({
  tagName: 'li'
  , events: {}
  , initialize: function() {
    return this.render()
  }
  , render: function() {
    $(this.el).append('<input><ul></ul>')
    return this
  }
})

window.ListView = Backbone.View.extend({
  tagName: 'ul'
  , events: {
    'click input':'event'
  }
  , initialize: function() {
    return this.render()
  }
  , render: function() {
    $(this.el).append(new ItemView().el)
    return this
  }
  , event: function(e) {
    console.log('TADA!')
  }
})

window.listView = new ListView()
$(listView.el).appendTo('body')

})