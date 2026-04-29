export async function GET() {
  return Response.json({
    mapsKey: process.env.GOOGLE_MAPS_API_KEY || '',
  });
}
