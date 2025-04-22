export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // 规则 1：根目录 → /index.html
    if (url.pathname === '/') {
      url.pathname = '/index.html';
    }
    // 规则 2：目录路径（如 /path/）→ /path/index.html
    else if (url.pathname.endsWith('/category-1/')) {
      url.pathname += 'index.html';
    }
    // 从 R2 或静态文件加载
    return fetch(url);
  }
};
