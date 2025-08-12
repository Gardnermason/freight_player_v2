// This exposes the browser Maps JS key to the frontend, if it's set as an env var.
export async function GET() {
  return Response.json({
    mapsKey: process.env.NEXT_PUBLIC_TRIMBLE_MAPS_KEY || ''
  });
}
