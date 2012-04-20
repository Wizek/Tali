load('application');

// before(loadUser, {only: ['new']})

// function loadUser() {
//   User.find(params.id, function (err, user) {
//     if (err) {
//       redirect(path_to.users())
//     } else {
//       this.user = user
//       next()
//     }
//   }.bind(this))
// }

// before(use('onlyLetThroughIfLoggedIn'), {except: ['new', 'create', 'destroy']})

action('new', function () {
  // var counter = ((typeof counter != 'undefined')?counter:'nope')
  this.user = new User
  render()
})

action(function create () {
  // var counter = ((typeof counter != 'undefined')?counter:'nope')
  this.title = 'Login'

  User.all({where:req.body.User}, function(err, users) {
    if (users.length) {
      flash('success', 'Beléptél.')
      session.user = users[0]
      redirect(path_to.root)
    } else {
      flash('error', 'Nem megfelelő becenév-jelszó kombináció.')
      // redirect('/')
      redirect(path_to.login)
    }
  })
  // this.session = req.session
  // render()
})

action(function destroy () {
  if (session.user) {
    delete session.user
    flash('success', 'Kiléptél.')
  } else {
    flash('error', 'Nem voltál belépve.')
  }
  redirect(path_to.login)
})

action(function index () {
  // return send({'egy':'kis json'})
  var obj = {}
  console.log(req.sessionStore)
  var s = req.sessionStore.sessions
  for (var key in s) if (s.hasOwnProperty(key)) {
    obj[key] = JSON.parse(s[key])
  }
  this.usersessions = obj
  this.title = 'session#index'
  render()
  //send(obj)
})
