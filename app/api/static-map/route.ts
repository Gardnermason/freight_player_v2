import { NextRequest, NextResponse } from 'next/server';

// POST so polylines don't get mangled in URL query strings
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { origin, waypoint, destination, poly1, poly2 } = body;
  const width = body.w || 800;
  const height = body.h || 500;

  const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  if (!API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    // Base params
    const base = `size=${width}x${height}&scale=2&maptype=roadmap&key=${API_KEY}`;
    let url = `https://maps.googleapis.com/maps/api/staticmap?${base}`;

    // Deadhead leg — thinner orange line
    if (poly1) {
      url += `&path=color:0xF9731699|weight:3|enc:${poly1}`;
    }

    // Loaded leg — thicker blue line drawn on top
    if (poly2) {
      url += `&path=color:0x4285F4ff|weight:5|enc:${poly2}`;
    }

    // Markers: T = truck (orange), P = pickup (green), D = drop (red)
    if (origin) {
      url += `&markers=color:orange|label:T|${encodeURIComponent(origin)}`;
    }
    if (waypoint) {
      url += `&markers=color:green|label:P|${encodeURIComponent(waypoint)}`;
    }
    if (destination) {
      url += `&markers=color:red|label:D|${encodeURIComponent(destination)}`;
    }

    const imgResp = await fetch(url);
    const imgBuf = await imgResp.arrayBuffer();

    return new NextResponse(imgBuf, {
      headers: {
        'Content-Type': imgResp.headers.get('Content-Type') || 'image/png',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET for the default map (no route yet)
export async function GET() {
  const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  if (!API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  const url = `https://maps.googleapis.com/maps/api/staticmap?center=39.8283,-98.5795&zoom=4&size=800x500&scale=2&maptype=roadmap&style=feature:water|color:0xa3ccf2&key=${API_KEY}`;
  const imgResp = await fetch(url);
  const imgBuf = await imgResp.arrayBuffer();

  return new NextResponse(imgBuf, {
    headers: {
      'Content-Type': imgResp.headers.get('Content-Type') || 'image/png',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
