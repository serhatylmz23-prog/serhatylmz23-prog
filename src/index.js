export default {
  async fetch(request, env) {
    const cors = {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
      "access-control-allow-headers": "Content-Type,Authorization"
    };
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    const url = new URL(request.url);
    if (url.pathname.startsWith("/runtime")) {
      // Basit placeholder; gerektiğinde proxy / auth ekleyebilirsin
      return new Response(JSON.stringify({ ok: true, message: "SYKASIF runtime OK" }), {
        status: 200,
        headers: { ...cors, "content-type": "application/json" }
      });
    }
    return new Response("Not found", { status: 404, headers: cors });
  }
}
