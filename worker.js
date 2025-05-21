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
  async fetch(request, env, context) {  // Added context parameter
    const url = new URL(request.url);
    const hostname = url.hostname;

    // 1. Check domain configuration
    const bucketName = SITE_TO_BUCKET[hostname];
    if (!bucketName) {
      return new Response("Domain not configured", { status: 404 });
    }

    // 2. Auto-complete index.html
    let pathname = url.pathname;
    if (pathname.endsWith('/') || !pathname.includes('.')) {
      pathname += 'index.html';
    }

    // 3. Generate cache key
    const cacheKey = new Request(`${hostname}${pathname}`, request);
    const cache = caches.default;

    // 4. Try to get from cache first
    let response = await cache.match(cacheKey);

    if (!response) {
      const objectKey = pathname.slice(1);
      const bucket = env[bucketName];
      
      try {
        const object = await bucket.get(objectKey);

        if (!object) {
          return new Response("File not found", { status: 404 });
        }

        response = new Response(object.body, {
          headers: {
            "Content-Type": object.httpMetadata?.contentType || "text/html",
            "Cache-Control": "public, max-age=86400",
            "CDN-Cache-Control": "public, max-age=86400",
          },
        });

        // Use context.waitUntil instead of event.waitUntil
        context.waitUntil(cache.put(cacheKey, response.clone()));
      } catch (error) {
        return new Response(`Error fetching object: ${error.message}`, { status: 500 });
      }
    }

    return response;
  },
};
