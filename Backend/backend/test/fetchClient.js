const fetchFn = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = { fetchFn };