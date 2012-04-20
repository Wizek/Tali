/*
 db/schema.js contains database schema description for application models
 by default (when using jugglingdb as ORM) this file uses database connection
 described in config/database.json. But it's possible to use another database
 connections and multiple different schemas, docs available at

 http://railwayjs.com/orm.html

 Example of model definition:

 define('User', function () {
     property('email', String, { index: true });
     property('password', String);
     property('activated', Boolean, {default: false});
 });

 Example of schema configured without config/database.json (heroku redistogo addon):
 schema('redis', {url: process.env.REDISTOGO_URL}, function () {
     // model definitions here
 });

*/

var User = describe('User', function () {
    property('username', String, {index: true})
    property('password', String/*, {index: true}*/)
    property('admin', Boolean, {default: false})
    property('createdAt', Date, {default: Date})
    property('updatedAt', Date, {default: Date})
    property('email', String)
})

// User.hasMany(User, {as:'meghivott', foreignKey: 'meghivott_id'})
// User.belongsTo(User, {as: 'meghivo', foreignKey: 'meghivo_id'})
var Node = describe('Node', function () {
    property('headline', String);
    property('body', String);
    property('createdAt', Date, {default: Date});
    property('updatedAt', Date, {default: Date});
})

Node.hasMany(Node, {as:'children', foreignKey: 'parentId'})
