# README

bunyan express middleware for logging

## Usage

```js
const loggerCreator = require('bunyan-express-middleware');
const logger = require('bunyan');

const loggerMiddleware = loggerCreator(logger, {
  headers: ['x-extra-header'],
});

app.use(loggerMiddleware);

```
