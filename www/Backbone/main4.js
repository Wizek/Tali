void function() {
  window.iAvg = Math.iAvg = function(a,b) {
    Math.abs(a-b) < 10
    return Math.round((a+b)/2)
  }
  var tplStr = {
    node: _.template(''
      // +'<span class="line">'
        +'<span class="handle plus">+</span>'
        +'<span class="handle minus">-</span>'
        +'<span class="handle dot">&nbsp;</span>'
        +'<textarea class="headline"><%= headline %></textarea>'
        +'<span class="focusedBy"></span>'
      // +'</span>'
      +'<textarea class="body"><%= body %></textarea>')
  }


  // io.connect('/editor')
  // console.log(io)
  // io.on('connect', function() {
  //   console.log('yupiiii', arguments)
  //   io.emit('asd')
  // })
  Backbone.sync = function() {
    console.log('Backbone.sync', arguments)
  }
  window.MAX_POS = Math.pow(2,32)-1
  window.MIN_POS = 0
  window.MID_POS = iAvg(MIN_POS, MAX_POS)
  window.Node = Backbone.Model.extend(
    { defaults: function() {
        var o =
          { headline: ''
          , body: ''
          , created_at: new Date()
          , updated_at: new Date()
          , position: MID_POS
          , children: null
          , expanded: true
          , locked: false
          , focus: null
          }
        return o
      }
    , initialize: function() {
      if (this.get('childnum') > 0) {
        var self = this
        window.socket.emit('get children of', this.get('id'), function(err, results) {
          console.log('get children of cb', arguments)
          for (var i in results) {
            var n = new Node(results[i])
            // n.isNew = false
            // n.set
            self.get('children').add(n)
            // self.add(n)
          }
        })
        topLevel.cache[this.get('id')] = this
      }
      this.view = new NodeView({model:this})
      this.set({children:new Children(null, {parent:this})})
      this.bind('change:body', updateUpdatedAt)
      this.bind('change:headline', function() {
        socket.emit('edit headline of node', this.get('headline'), this.get('id'), function() {
          console.log('edit headline of node cb', arguments)
        })
      })
      this.bind('change:headline', updateUpdatedAt)
      this.bind('change:position', updateUpdatedAt)
      //this.bind('change:id', function(){console.log('ID VÁLTOZOTT', arguments)})
      function updateUpdatedAt (self) {
        self.set({'updated_at':new Date()})
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
      console.log(this)
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
    , first: function() {
      return this.min(function(v) {
        return v.get('position')
      })
    }
    , last: function() {
      return this.max(function(v) {
        return v.get('position')
      })
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
      this.model.bind('change:focus', this.changeViewFocus, this)
      this.model.bind('destroy', this.destroy, this)
      this.render()
      $(this.el).find('> .headline').mousedown(this.changeModelFocus.bind(this))
    }
    , events: {
      'change .headline': 'changeModelHead',
      'keyup .headline': 'changeModelHead',
      'blur .headline': 'changeModelHead',
      'change .body': 'changeModelBody',
      'keyup .body': 'changeModelBody',
      'blur .body': 'changeModelBody',
      //'click .plus': 'changeModelFocus',
    }
    , changeViewExpanded: function() {
      var e = this.model.get('expanded')
      var t = this.model.get('children').view.$el
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
        prev.view.$el.after(this.$el)
      } else {
        this.model.collection.view.$el.prepend(this.$el)
      }
    }
    , changeModelHead: function() {
      // TODO not just change event
      var text = this.$el.children('.headline').val()
      this.model.set({headline: text})
    }
    , changeModelBody: function() {
      var text = this.$el.children('.body').val()
      this.model.set({body: text})
    }
    , changeModelFocus: function() {
      focus.at(this.model)
    }
    , changeViewHead: function() {
      // console.log('changeViewHead', this.model.get('headline'))
      this.$el.children('.headline').val(this.model.get('headline'))
    }
    , changeViewBody: function() {
      this.$el.children('.body').val(this.model.get('body'))
    }
    , changeViewFocus: function(node, focus) {
      var f = node.get('focus')
      if (!f) {
        this.$el.removeClass('focused ours theirs')
      } else {
        this.$el.addClass('focused '+(f.get('ours')?'ours':'theirs'))
      }
    }
    , render: function() {
      this.$el.html(tplStr.node(this.model.toJSON()))
    }
    , destroy: function() {
      this.$el.remove()
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
      window.title = 'Tali WIP'
      _.bindAll(this, 'render')
      this.render()
      var socket = window.socket = io.connect('http://localhost:3000');
      socket.on('connect', function (data) {
        //console.info('sucessfully established a connection with the namespace')
        tryToConnect()
        function tryToConnect () {
          socket.emit('set envId', 'eg14g14g14241g1', function(err, isLoggedIn) {
            if (err) {
              console.log('még nem voltam belépve')
              console.log('belépek')
              socket.emit('login', 'Fodi69', 'mypass', function(err, userId) {
                if (err) {
                  console.error(err)
                } else {
                  console.log('sikeres belépés', userId)
                  tryToConnect()
                }
              });
            } else {
              if (isLoggedIn) {
                console.log('már be voltam lépve')
              var notify = function(message) {
                var el = $('<div class="notification">').text(message)
                  el.prependTo('#notifications')
                  setTimeout(function() {
                    el.remove()
                }, 5000)
              }
              socket.on('user joined', function(username, userId) {
                notify(username + ' csatlakozott.')
              })
              socket.on('user left', function(username, userId) {
                notify(username + ' szétkapcsolt.')
              })
              socket.on('change focus', function(nodeId, username) {
                var c = topLevel.cache[nodeId]
                if (!asd[username]) {
                  asd[username] = new Focus({ours:false, username:username})
                }
                asd[username].at(c)
                //f.at(c)
                console.log(arguments)
              })
              socket.on('change headline', function(nodeId, newHeadline, username) {
                topLevel.cache[nodeId].set('headline', newHeadline)
              })
              socket.on('disconnect', function() {
                notify('Szétkapcsoltál')
                })
                socket.emit('get children of', 0, function(err, results) {
                  console.log('get children of cb')
                  for (var i in results) {
                    var n = new Node(results[i])
                    if (i == 0) {
                      focus.at(n)
                    }
                    // n.isNew = false
                    topLevel.add(n)
                  }
                  //console.log('bóó', arguments)
                })
              }
            }
          })
        }
      })

    }
    , render:function() {
      $(this.el).append('<div id="notifications"></div>')
    }
  })

  window.Focus = Backbone.Model.extend({
    defaults: {
      at: null,
      ours: false,
    },
    initialize: function() {
      this.view = new FocusView({model:this})
      _.bindAll(this, 'at')
      // console.log(this)
      // _.bind(this.goUp, this)
      this.bind('change:at', this.atChanged)
    },
    atChanged: function(focus, at) {
      socket.emit('set focus', at.get('id'), function() {
        console.log('set focus cb', arguments)
      })
      // * shortcut
      //socket.emit('lock', at.get('id'), function() {
      //  console.log(arguments)
      //})
      at.set({focus:focus})
      var prev = focus.previousAttributes()
      if (prev.at) {
        prev.at.set({focus:null})
      }
    },
    at: function(v) {
      // console.log(this)
      if (arguments.length) {
        if (!v) {return}
        if (v.get('focus')) {
          throw new Error('Trying to override focus', this, v)
        }
        this.set({at:v})
        return v
      } else {
        return this.get('at')
      }
    },
    goUp: function() {
      // console.log(this)
      this.at(this.at().prevNode())
    },
    goDown: function() {
      this.at(this.at().nextNode())
    },
    goIn: function() {
      this.at(this.at().get('children').first())
    },
    goOut: function() {
      this.at(this.at().collection.parent)
    },
    // goFlatUp: function() {},
    // goFlatDown: function() {},
    addNodeAfterAndFocusIt: function() {
      var t = this.at
      var n = new Node
      t().after(n)
      var parentId = t().collection.parent? t().collection.parent.get('id') :0
      socket.emit('new node by position', parentId
        , n.get('position'), function(err, nodeId, nodePosition) {
        console.log('new node by position cb', arguments)
        n.set('id', nodeId)
        // if (!err) {
        //   n.isNew = false
        // }
        t(n)
      })
    },
    deleteNodeAndFocusPrevious: function() {
      var t = this.at()
      var prevHead = t.prevNode().get('headline')
      var ourHead = t.get('headline')
      t.prevNode().set({headline: prevHead+ourHead})
      this.at(t.prevNode())
      t.delete()
      return prevHead.length
    },
    deleteNodeAndFocusNext: function() {},
    expandCurrentLevel: function() {
      this.at().expand()
    },
    collapseCurrentLevel: function() {
      this.at().collapse()
    },
    expandAndGoIn: function() {},
    // goOutAndCollapse: function() {},
    moveUp: function() {
      this.at().moveUp()
      this.view.focusHeadElement()
    },
    moveDown: function() {
      this.at().moveDown()
      this.view.focusHeadElement()
    },
    // moveFlatUp: function() {},
    // moveFlatDown: function() {},
    moveIn: function() {
      this.at().moveIn()
      this.view.focusHeadElement()
    },
    moveOut: function() {
      this.at().moveOut()
      this.view.focusHeadElement()
    },
    copyAfterAndFocusIt: function() {},
  })
  // Focus.prototype.goUp = Focus.prototype.goUp.bind(Focus.prototype)
  // Focus.prototype.at = Focus.prototype.at.bind(Focus.prototype)

  window.FocusView = Backbone.View.extend({
    initialize: function() {
      var m = this.model
      _self = this
      this.model.bind('change:at', this.focusHeadElement, this)
      this.model.bind('destroy', this.destroy, this)
      // _.bindAll(this, 'focusHeadElement')
      // window.addEventListener('click', m.goUp.bind(m), true)
      shortcut.add('up', m.goUp.bind(m))
      shortcut.add('down', m.goDown.bind(m))
      shortcut.add('alt+up', m.goUp.bind(m))
      shortcut.add('alt+down', m.goDown.bind(m))
      shortcut.add('alt+right', m.goIn.bind(m))
      shortcut.add('alt+left', m.goOut.bind(m))
      shortcut.add('enter', m.addNodeAfterAndFocusIt.bind(m))

      shortcut.add('backspace', function() {
        // console.log('Duty calls!', arguments)
        var _ref
        _ref = m.at().view.$el.find('> .headline').get(0)
        console.log()
        // If the cursore is at the beginning
        if (_ref.selectionStart == 0 && _ref.selectionEnd == 0) {
          socket.emit('delete node refs by id', m.at().get('id'), function() {
            console.log('delete node refs by id cb', arguments)
          })
          var at = m.deleteNodeAndFocusPrevious.apply(m)
          m.at().view.$el.find('> .headline').get(0).setSelectionRange(at, at)
          return false // !!!! Precent cascade!
        }
      }, {
        propagate: true
      })

      // shortcut.add('delete', m.deleteNodeAndFocusNext.bind(m))
      shortcut.add('alt+l', m.expandCurrentLevel.bind(m))
      shortcut.add('alt+h', m.collapseCurrentLevel.bind(m))
      shortcut.add('alt+shift+up', m.moveUp.bind(m))
      shortcut.add('alt+shift+down', m.moveDown.bind(m))
      shortcut.add('alt+shift+right', m.moveIn.bind(m))
      shortcut.add('alt+shift+left', m.moveOut.bind(m))
      shortcut.add('tab', m.moveIn.bind(m))
      shortcut.add('shift+tab', m.moveOut.bind(m))
      shortcut.add('ctrl+down', m.copyAfterAndFocusIt.bind(m))
      /*\
       *  Őket Hagyjuk békén:
       *  shift jobb-bal-ra
       *  ctrl jobb-bal-ra
       *  ctrl-shift jobb-bal-ra
       *  ...
      \*/
    },
    focusHeadElement: function() {
      $(this.model.at().view.el).find('> .headline').focus()
    },
  })

  window.focus = new Focus({ours:true})
  // console.log(focus.at().view.el)

  window.topLevel = new Children(null, {parent:null})
  window.topLevel.cache = {}
  window.asd = {}
}()