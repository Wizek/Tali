exports.routes = function (map) {
  // map.resources('nodes');
  map.root('root#index')

  map.resources('users')

  map.get('signup.:format?', 'users#new')
  map.post('login', 'session#create')
  // map.put('session', 'session#create')
  // map.delete('session', 'session#destroy')
  map.get('logout', 'session#destroy')
  map.get('login', 'session#new')
  map.get('sessions', 'session#index')


  map.delete('test', 'root#test')
  // console.log('app',app.sio)


  // Generic routes. Add all your routes below this line
  // feel free to remove generic routes
  map.all(':controller/:action');
  map.all(':controller/:action/:id');
};
