void function() {
  window.iAvg = Math.iAvg = function(a,b) {
    Math.abs(a-b) < 10
    return Math.round((a+b)/2)
  }
  var tplStr = {
    node: _.template(''
      +'<span class="handle plus">+</span>'
      +'<span class="handle minus">-</span>'
      +'<span class="handle dot">&nbsp;</span>'
      +'<textarea class="headline"><%= headline %></textarea>'
      +'<textarea class="body"><%= body %></textarea>')
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
        , children: null
        , expanded: true
        , locked: false
      }
      return o
    }
    , initialize: function() {
      this.view = new NodeView({model:this})
      this.set({children:new Children(null, {parent:this})})
      this.bind('change:body', updateUpdatedAt)
      this.bind('change:headline', updateUpdatedAt)
      this.bind('change:position', updateUpdatedAt)
      function updateUpdatedAt (self) {
        self.set({'updatedAt':new Date()})
      }
    }
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
      coll.add(node)
      node.set({position:newPos})
    }
    , after: function(node) {
      var pos = this.get('position')
      var coll = this.collection
      newPos = iAvg(pos, this.nextPos())
      coll.add(node)
      node.set({position:newPos})
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
    , initialize: function(models, opts) {
      this.parent = opts ? opts.parent || null : null
      this.view = new ChildrenView({collection:this})
    }
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
      this.model.bind('change:headline', this.changeViewHead, this)
      this.model.bind('change:body', this.changeViewBody, this)
      this.model.bind('change:position', this.changeViewPosition, this)
      this.model.bind('change:expanded', this.changeViewExpanded, this)
      this.render()
    }
    , events: {
      'change .headline': 'changeModelHead',
      'keyup .headline': 'changeModelHead',
      'blur .headline': 'changeModelHead',
      'change .body': 'changeModelBody',
      'keyup .body': 'changeModelBody',
      'blur .body': 'changeModelBody',
    }
    , changeViewExpanded: function() {
      var e = this.model.get('expanded')
      var t = $(this.model.get('children').view.el)
      t.removeClass(e?'hidden':'visible')
      t.addClass(e?'visible':'hidden')

    }
    , changeViewPosition: function() {
      var coll = this.model.collection
      if (!coll) {
        return console.warn('Changed position of an orphan node', this)
      }
      var prev = this.model.prevNode()
      if (prev) { 
        $(prev.view.el).after(this.el)
      } else {
        $(this.model.collection.view.el).prepend(this.el)
      }
    }
    , changeModelHead: function() {
      // TODO not just change event
      var text = $(this.el).children('.headline').val()
      this.model.set({headline: text})
    }
    , changeModelBody: function() {
      var text = $(this.el).children('.body').val()
      this.model.set({body: text})
    }
    , changeViewHead: function() {
      $(this.el).children('.headline').text(this.model.get('headline'))
    }
    , changeViewBody: function() {
      $(this.el).children('.body').text(this.model.get('body'))
    }
    , render: function() {
      $(this.el).html(tplStr.node(this.model.toJSON()))
    }
  })

  window.ChildrenView = Backbone.View.extend({
    tagName: 'ul',
    initialize: function() {
      var self = this
      this.collection.bind('add', function(node) {
        $(self.collection.view.el).append(node.view.el)
      })
      this.render()
    },
    render: function() {
      var p = this.collection.parent
      if (p) {
        $(this.el).addClass(p.get('expanded') ? 'visible' : 'hidden')
        $(p.view.el).append(this.el)
      }
    }
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

  window.topLevel = new Children(null, {parent:null})

}()