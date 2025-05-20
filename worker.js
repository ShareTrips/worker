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
  async fetch(request, env) {
    const url = new URL(request.url);
    const hostname = url.hostname;

    // 1. 检查域名配置
    const bucketName = SITE_TO_BUCKET[hostname];
    if (!bucketName) {
      return new Response("Domain not configured", { status: 404 });
    }

    // 2. 自动补全 index.html
    let pathname = url.pathname;
    if (pathname.endsWith('/') || !pathname.includes('.')) {
      pathname += 'index.html';
    }

    // 3. 生成缓存键（包含域名和路径，避免冲突）
    const cacheKey = new Request(`${hostname}${pathname}`, request);
    const cache = caches.default;

    // 4. 先尝试从 Cloudflare 边缘缓存读取
    let response = await cache.match(cacheKey);

    // 5. 缓存未命中时，从 R2 获取并缓存
    if (!response) {
      const objectKey = pathname.slice(1); // 移除路径开头的 `/`
      const bucket = env[bucketName];
      const object = await bucket.get(objectKey);

      if (!object) {
        return new Response("File not found", { status: 404 });
      }

      // 构建响应并设置缓存头
      response = new Response(object.body, {
        headers: {
          "Content-Type": object.httpMetadata?.contentType || "text/html",
          "Cache-Control": "public, max-age=86400", // 缓存 24 小时
          "CDN-Cache-Control": "public, max-age=86400", // 确保 Cloudflare CDN 缓存
        },
      });

      // 将响应存储到缓存（非阻塞）
      event.waitUntil(cache.put(cacheKey, response.clone()));
    }

    return response;
  },
};
