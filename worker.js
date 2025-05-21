// 定义域名到 R2 桶的映射
const SITE_TO_BUCKET = {
  "www.bausch.cc": "r2-bucket-bausch-cc",
  "www.tunz.cn": "r2-bucket-tunz-cn",
  "www.iv587.cc": "r2-bucket-iv587-cc",
  "www.nepicool.cc": "r2-bucket-nepicool-cc",
  "www.school-link.cc": "r2-bucket-school-link-cc",
  "www.dszhw.cn": "r2-bucket-dszhw-cn",
  "www.desbts.com": "r2-bucket-desbts-com",
  "www.wxgames.cc": "r2-bucket-wxgames-cc",
  "www.topmom.cc": "r2-bucket-topmom-cc",
  "www.bxgdata.cn": "r2-bucket-bxgdata-cn",
  "www.donglier.com.cn": "r2-bucket-donglier-com-cn",
  "www.wodecheng.com.cn": "r2-bucket-wodecheng-com-cn",
  "www.szxywl.com.cn": "r2-bucket-szxywl-com-cn",
};

export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);
    const hostname = url.hostname;    

     // 1. 查找对应的 R2 桶
    const bucketName = SITE_TO_BUCKET[hostname];
    if (!bucketName) {
      return new Response("Domain not configured", { status: 404 });
    }

    // 1. 自动补全 index.html
    let pathname = url.pathname;
    if (pathname.endsWith('/') || !pathname.includes('.')) {
      pathname += 'index.html';
    }

    // 2. 生成缓存键（使用完整 URL 避免冲突）
    const cacheKey = new Request(url.origin + pathname, request);
    const cache = caches.default;

    // 3. 先检查边缘缓存
    let response = await cache.match(cacheKey);

    // 4. 缓存未命中时回源到 R2
    if (!response) {
      const objectKey = pathname.slice(1); // 移除开头的 `/`
      const bucket = env[bucketName];
      const object = await bucket.get(objectKey);

      if (!object) {
        return new Response("File not found", { status: 404 });
      }

      // 5. 设置缓存头（关键！控制 Cloudflare 边缘缓存行为）
      const headers = new Headers();
      headers.set("Content-Type", object.httpMetadata?.contentType || "text/html");
      
      // 核心优化：告诉 Cloudflare CDN 缓存此文件
      headers.set("Cache-Control", "public, max-age=86400"); // 浏览器缓存 1 天
      headers.set("CDN-Cache-Control", "public, max-age=86400"); // Cloudflare 边缘缓存 7 天

      // 可选：添加 ETag 或 Last-Modified 支持协商缓存
      if (object.etag) {
        headers.set("ETag", object.etag);
      }

      response = new Response(object.body, { headers });

      // 6. 将响应存入边缘缓存（非阻塞）
      context.waitUntil(cache.put(cacheKey, response.clone()));
    }

    return response;
  }
};
