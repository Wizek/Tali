load('application')

before(use('onlyLetThroughIfLoggedIn'), {except: ['new', 'create']})
before(loadUser, {only: ['show']})

action("new", function () {
  // console.log(this.user.secret_code)
  // var s = this.user ? this.user.secret_code : ''
  // flash('info', 't() => '+t('asd'))
  this.user = this.user || new User()
  // this.user.secret_code = s
  render()
})

action("create", function () {
  var u = new User(req.body.User)
  u.secret_code = req.body.User.secret_code
  u.save(function (err, user) {
    if (err) {
      console.log(err)
      flash('error', 'Sikertelen. Ellenőrizd a hibás mezőket.')
      render('new', {
        user: user,
        title: 'New user'
      })
    } else {
      flash('success', 'User created')
      redirect('/')
    }
  })
})

action(function index() {
  this.title = 'Users index';
  User.all(function (err, users) {
    render({
      users: users
    })
  })
})


action(function show() {
    this.title = 'Post show'
    // console.log(GLOBAL)
    // this.user.asd = counter++
    // this.user.asd2 = counter++
    render()
})

function loadUser() {
    User.find(params.id, function (err, user) {
        if (err) {
            redirect(path_to.users())
        } else {
            this.user = user
            next()
        }
    }.bind(this))
}
