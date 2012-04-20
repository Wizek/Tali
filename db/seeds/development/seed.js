console.log('Populating seeds')

Node.destroyAll(function() {

  Node.create(
    { headline: 'ERROR! GLOBAL SHOULD REMAIN HIDDEN'
    , parentId: 0
    , id: 1
    }
  )
  // g.save(function(e) {
  //   console.log(e)
  // })
  // var g_1 = new Node({headline:'This is a test line!',position:2147483648})
  // g.children.create(g_1)
  // g_1.save()
  // g_1.children.create({headline: '123', position:1073741824})

})

// console.log('Population done.')
