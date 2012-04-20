load('application');

before(use('onlyLetThroughIfLoggedIn'))
before(loadNode, {only: ['show', 'edit', 'update', 'destroy']})

action('new', function () {
    this.title = 'New node';
    this.node = new Node;
    render();
});

action(function create() {
    Node.create(req.body.Node, function (err, node) {
        if (err) {
            flash('error', 'Node can not be created');
            render('new', {
                node: node,
                title: 'New node'
            });
        } else {
            flash('info', 'Node created');
            redirect(path_to.nodes());
        }
    });
});

action(function index() {
    var respond = params.format=='json'?send:render
    this.title = 'Nodes index';
    Node.all(function (err, nodes) {
        respond({
            nodes: nodes
        });
    });
});

action(function show() {
    this.title = 'Node show';
    render();
});

action(function edit() {
    this.title = 'Node edit';
    render();
});

action(function update() {
    this.node.updateAttributes(body.Node, function (err) {
        if (!err) {
            flash('info', 'Node updated');
            redirect(path_to.node(this.node));
        } else {
            flash('error', 'Node can not be updated');
            this.title = 'Edit node details';
            render('edit');
        }
    }.bind(this));
});

action(function destroy() {
    this.node.destroy(function (error) {
        if (error) {
            flash('error', 'Can not destroy node');
        } else {
            flash('info', 'Node successfully removed');
        }
        send("'" + path_to.nodes() + "'");
    });
});

function loadNode() {
    Node.find(params.id, function (err, node) {
        if (err) {
            redirect(path_to.nodes());
        } else {
            this.node = node;
            next();
        }
    }.bind(this));
}
