export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/')) {
      url.pathname += 'index.html';
    }
    return fetch(url);
  }
};
