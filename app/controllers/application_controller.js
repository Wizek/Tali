before('protect from forgery', function () {
    protectFromForgery('3e0d5afbd2f7a7d93eff1432e25380d2a91bf868');
});

before(function(next) {
  this.isLoggedIn = !!req.session.user
  next()
})


publish('onlyLetThroughIfLoggedIn', function (next) {
  if (this.isLoggedIn) {
    next()
  } else {
    send(401)
  }
})
