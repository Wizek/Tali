load('application');


// if (app.sio.refreshWith) {
//   debugger
//   app.sio.refreshWith({
//     asd: function() {
//       console.log(arguments)
//     }
//   })
// }

app.sio.watched =
  { 'asd asd': function() {
      console.log('Im calllled!!!!!!', arguments)
    }
  , 'get children of': function(nodeId, cb) {
      Node.all({where:{parentId:nodeId}}, function(err, res) {
        cb(null, res)
      })
      // console.log('nodeId', nodeId)
      // Node.find(nodeId, function(err, node) {
      //   console.log(node.children(function() {
      //     console.log('Ez az', arguments)
      //   }))
      // })
      // Node.all({where:{parentId:nodeId}}, function() {
      //   console.log('Ez nem az', arguments)
      // })
      // return cb(null, [{"id":3,"headline":"#3 - Child of 1 and 2","body":"3","updated_at":"2012-04-08T23:46:31.000Z","created_at":"2012-04-08T23:46:31.000Z","parent_id":1,"position":0,"childnum":0},{"id":2,"headline":"#2 - Child of 1","body":"2","updated_at":"2012-04-08T23:46:31.000Z","created_at":"2012-04-08T23:46:31.000Z","parent_id":1,"position":4194304,"childnum":0}])
    }
}

action(function index() {
  // socket.emit('ASdasd')
  this.isLoggedIn = true
  if (this.isLoggedIn) {
    layout(false)
    render('private')
  } else {
    render('public')
  }
})

action(function test() {
  console.log('ohai')
  send('console.log("I jsonp\'d!")  ')
})
