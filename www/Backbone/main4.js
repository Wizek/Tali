void function() {
  window.iAvg = Math.iAvg = function(a,b) {
    Math.abs(a-b) < 10
    return Math.round((a+b)/2)
  }
  var tplStr = {
    node: ''
      +'<span class="handle plus">+</span>'
      +'<span class="handle minus">-</span>'
      +'<span class="handle dot">&nbsp;</span>'
      +'<span class="headline"><%= headline %></span>'
      +'<span class="body"><%= body %></span>'
  }
  
  window.MAX_POS = Math.pow(2,32)-1
  window.MIN_POS = 0
  window.Node = Backbone.Model.extend({
    defaults: function() {
      var o = {
        headline: ''
        , body: ''
        , createdAt: new Date()
        , updatedAt: new Date()
        , position: 2147483648 //Math.round((0+(Math.pow(2,32)-1))/2)
        , children: new Children()
        , expanded: true
        , locked: false
      }
      o.children.parent = this
      return o
    }
    , initialize: function() {
      this.bind('change:body', updateUpdatedAt)
      this.bind('change:headline', updateUpdatedAt)
      this.bind('change:position', updateUpdatedAt)
      function updateUpdatedAt (self) {
        self.set({'updatedAt':new Date()})
      }
    }
    , 'change: headline': function() {}
    , prevPos: function() {
      var pos = this.get('position')
      var coll = this.collection
      var t = coll.reduce(function(a, b) {
        var ap = a.get('position')
        var bp = b.get('position')
        if (bp < pos && bp > ap) {
          return b
        } else {
          return a
        }
      }, new Node({position:MIN_POS}))
      return t.get('position')
    }
    , nextPos: function() {
      var pos = this.get('position')
      var coll = this.collection
      var t = coll.reduce(function(a, b) {
        var ap = a.get('position')
        var bp = b.get('position')
        if (bp > pos && bp < ap) {
          return b
        } else {
          return a
        }
      }, new Node({position:MAX_POS}))
      return t.get('position')
    }
    , prevNode: function() {
      return this.collection.getByPosition(this.prevPos())
    }
    , nextNode: function() {
      return this.collection.getByPosition(this.nextPos())
    }
    , before: function(node) {
      var pos = this.get('position')
      var coll = this.collection
      newPos = iAvg(this.prevPos(), pos)
      node.set({position:newPos})
      coll.add(node)
    }
    , after: function(node) {
      var pos = this.get('position')
      var coll = this.collection
      newPos = iAvg(pos, this.nextPos())
      node.set({position:newPos})
      coll.add(node)
    }
    , appendChild: function(node) {
      this.get('children').append(node)
    }
    , moveInto: function(ch) {
      this.collection.remove(this)
      ch.append(this)
    }
    , moveUp: function() {
      var p = this.prevNode()
      if (!p) {return}
      var pp = p.prevNode() || new Node({position:MIN_POS})
      this.set({position:iAvg(p.get('position'), pp.get('position'))})
    }
    , moveDown: function() {
      var n = this.nextNode()
      if (!n) {return}
      var nn = n.nextNode() || new Node({position:MAX_POS})
      this.set({position:iAvg(n.get('position'), nn.get('position'))})
    }
    , moveIn: function() {
      var prev = this.prevNode()
      if (!prev) {return}
      this.collection.remove(this)
      prev.get('children').append(this)
    }
    , moveOut: function() {
      var par = this.collection.parent
      if (!par) {return}
      this.collection.remove(this)
      par.after(this)
    }
    , childCount: function() {
      return this.get('children').size()
    }
    , collapse: function() {
      this.set({expanded:false})
    }
    , expand: function() {
      this.set({expanded:true})
    }
    , delete: function() {
      this.destroy()
    }
  })

  window.Children = Backbone.Collection.extend({
    model: Node
    , getByPosition: function(position) {
      return this.find(function(node) {
        return node.get('position') == position
      }) || null
    }
    , append: function(node) {
      if (this.size()) {
        var last = this.max(function(v) {return v.get('position')}).get('position')
        node.set({position:iAvg(last, MAX_POS)})
      }
      this.add(node)
    }
  })

  window.NodeView = Backbone.View.extend({
    tagName: 'li'
    , initialize: function() {
      _.bindAll(this, 'render')
      this.render()
    }
    , render: function() {
      var template = _.template(tplStr.node)
      $(this.el).html(template({body: 'Foo', headline: 'Bar'}))
    }
  })

  window.ChildrenView = Backbone.View.extend({
    tagName: 'ul'
    // , 
  })
  window.Interface = Backbone.View.extend({
    className: 'tali-top'
    , tagName: 'div'
    , initialize: function () {
      _.bindAll(this, 'render')
      this.render()
    }
    , render:function() {
      $(this.el).append("<ul></ul>")
    }
  })

  window.topLevel = new Children()

}()