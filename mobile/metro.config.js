const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      const originalWriteHead = res.writeHead;
      res.writeHead = function(...args) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        return originalWriteHead.apply(this, args);
      };
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
