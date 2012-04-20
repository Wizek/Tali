require('../test_helper.js').controller('nodes', module.exports);

var sinon  = require('sinon');

function ValidAttributes () {
    return {
        headline: '',
        body: '',
        createdAt: '',
        updatedAt: ''
    };
}

exports['nodes controller'] = {

    'GET new': function (test) {
        test.get('/nodes/new', function () {
            test.success();
            test.render('new');
            test.render('form.' + app.set('view engine'));
            test.done();
        });
    },

    'GET index': function (test) {
        test.get('/nodes', function () {
            test.success();
            test.render('index');
            test.done();
        });
    },

    'GET edit': function (test) {
        var find = Node.find;
        Node.find = sinon.spy(function (id, callback) {
            callback(null, new Node);
        });
        test.get('/nodes/42/edit', function () {
            test.ok(Node.find.calledWith('42'));
            Node.find = find;
            test.success();
            test.render('edit');
            test.done();
        });
    },

    'GET show': function (test) {
        var find = Node.find;
        Node.find = sinon.spy(function (id, callback) {
            callback(null, new Node);
        });
        test.get('/nodes/42', function (req, res) {
            test.ok(Node.find.calledWith('42'));
            Node.find = find;
            test.success();
            test.render('show');
            test.done();
        });
    },

    'POST create': function (test) {
        var node = new ValidAttributes;
        var create = Node.create;
        Node.create = sinon.spy(function (data, callback) {
            test.strictEqual(data, node);
            callback(null, node);
        });
        test.post('/nodes', {Node: node}, function () {
            test.redirect('/nodes');
            test.flash('info');
            test.done();
        });
    },

    'POST create fail': function (test) {
        var node = new ValidAttributes;
        var create = Node.create;
        Node.create = sinon.spy(function (data, callback) {
            test.strictEqual(data, node);
            callback(new Error, node);
        });
        test.post('/nodes', {Node: node}, function () {
            test.success();
            test.render('new');
            test.flash('error');
            test.done();
        });
    },

    'PUT update': function (test) {
        Node.find = sinon.spy(function (id, callback) {
            test.equal(id, 1);
            callback(null, {id: 1, updateAttributes: function (data, cb) { cb(null); }});
        });
        test.put('/nodes/1', new ValidAttributes, function () {
            test.redirect('/nodes/1');
            test.flash('info');
            test.done();
        });
    },

    'PUT update fail': function (test) {
        Node.find = sinon.spy(function (id, callback) {
            test.equal(id, 1);
            callback(null, {id: 1, updateAttributes: function (data, cb) { cb(new Error); }});
        });
        test.put('/nodes/1', new ValidAttributes, function () {
            test.success();
            test.render('edit');
            test.flash('error');
            test.done();
        });
    },

    'DELETE destroy': function (test) {
        test.done();
    },

    'DELETE destroy fail': function (test) {
        test.done();
    }
};

