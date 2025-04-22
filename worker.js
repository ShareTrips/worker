// 定义域名到 R2 桶的映射
const SITE_TO_BUCKET = {
  "www.bausch.cc": "r2-bucket-bausch-cc",
  // 添加更多域名和桶...
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const hostname = url.hostname;

    // 1. 查找对应的 R2 桶
    const bucketName = SITE_TO_BUCKET[hostname];
    if (!bucketName) {
      return new Response("Domain not configured", { status: 404 });
    }

    // 2. 自动补全 index.html
    if (url.pathname.endsWith('/') || !url.pathname.includes('.')) {
      url.pathname += 'index.html';
    }

    // 3. 从 R2 桶获取文件
    const objectKey = url.pathname.slice(1); // 移除路径开头的 `/`
    const bucket = env[bucketName]; // 需要绑定 R2 桶到 Worker
    const object = await bucket.get(objectKey);

    // 4. 返回文件或 404
    if (object) {
      return new Response(object.body, {
        headers: { "Content-Type": object.httpMetadata?.contentType || "text/html" },
      });
    }
    return new Response("File not found", { status: 404 });
  },
};
