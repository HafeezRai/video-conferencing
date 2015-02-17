'use strict';

var path = require('path');
var FRONTEND_PATH = path.join(__dirname, '../../frontend');
var CSS_PATH = FRONTEND_PATH + '/css';
var VIEW_PATH = FRONTEND_PATH + '/views';
var config = require('../core').config('default');

var lessMiddlewareConfig = {
  production: {
    options: {
      once: true
    }
  },
  dev: {
    options: {
      force: true,
      debug: true,
      compiler: {
        sourceMap: true
      }
    }
  }

};

var express = require('express');
var application = express();

application.set('views', VIEW_PATH);
application.set('view engine', 'jade');

var lessMiddleware = require('less-middleware');
application.use(lessMiddleware(
  FRONTEND_PATH,
  process.env.NODE_ENV === 'production' ? lessMiddlewareConfig.production.options : lessMiddlewareConfig.dev.options));

if (process.env.NODE_ENV !== 'test') {
  var morgan = require('morgan');
  application.use(morgan());
}

application.use('/components', express.static(FRONTEND_PATH + '/components'));
application.use('/images', express.static(FRONTEND_PATH + '/images'));
application.use('/js', express.static(FRONTEND_PATH + '/js'));
application.use('/css', express.static(CSS_PATH));

var bodyParser = require('body-parser');
application.use(bodyParser.json());
application.use(bodyParser.urlencoded());

var cookieParser = require('cookie-parser');
application.use(cookieParser('this is the secret!'));

var session = require('express-session');
var cdm = require('connect-dynamic-middleware');
var sessionMiddleware = cdm(session({ cookie: { maxAge: 60000 }}));
application.use(sessionMiddleware);
require('./middlewares/setup-sessions')({}).setupSession(sessionMiddleware);

var i18n = require('../i18n');
application.use(i18n.init);

var flash = require('connect-flash');
application.use(flash());

/**
 * Make the appName of the configuration available to template
 */
application.locals.appName = config.app && config.app.name ? config.app.name : '';

function views(req, res) {
  var templateName = req.params[0].replace(/\.html$/, '');
  return res.render(templateName);
}

application.get('/views/*', views);

/**
 * The main express application
 */
exports = module.exports = application;
