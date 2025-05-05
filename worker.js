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
