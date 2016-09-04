const express = require('express');
const exphbs = require('express-handlebars');
const server = require('./simple-http-server');

const app = express();

app.engine('handlebars', exphbs({extname: '.hbs'}));
app.set('view engine', 'handlebars');

app.get('/*', (req, res, next) => {
    console.log('Params', JSON.stringify(req.params));
    server.send_head(req.params['0'], res);
});

module.exports = app;