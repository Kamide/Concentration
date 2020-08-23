require('dotenv').config()

module.exports = function devlog(message) {
  if (process.env.NODE_ENV == 'development') {
    console.log(message);
  }
};
