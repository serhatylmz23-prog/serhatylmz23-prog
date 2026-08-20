// Güvenlik nedeniyle kaldırıldı: Bu eski uç nokta, Cloudflare yönetim token'ını
// kimliği doğrulanmamış genel bir proxy üzerinden accounts/zones/workers
// yollarına taşıyordu. Uygulama yalnızca dar kapsamlı /api/chat ve /api/vision
// uç noktalarını kullanmalıdır.
export default function handler(_req, res) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(410).json({
    error: 'Bu genel Cloudflare proxy uç noktası kalıcı olarak kaldırıldı.',
  });
}
