const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { version, name } = require('../package.json');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/error-handler');
const { NotFoundError } = require('./utils/custom-error');

const createApp = () => {
  const app = express();
  const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
  const hasFrontendBuild = fs.existsSync(frontendDistPath);

  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.get('/version', (req, res) => {
    res.json({
      name,
      version,
      message: 'Welcome to the REST API',
    });
  });

  app.use('/api', routes);

  if (hasFrontendBuild) {
    app.use(express.static(frontendDistPath));

    app.get(/^\/(?!api).*/, (req, res) => {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
  }

  app.use((req, res, next) => {
    next(new NotFoundError(`Route ${req.originalUrl} not found`));
  });

  app.use(errorHandler);

  return app;
};

module.exports = createApp();
module.exports.createApp = createApp;
// test branch protection
