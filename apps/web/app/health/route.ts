// Health check endpoint. Returns 200 so uptime pings / probes stop logging 404s.
export function GET() {
  return new Response("ok", { status: 200 });
}
