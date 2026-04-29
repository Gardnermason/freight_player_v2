import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { origin, destination } = await request.json();

    if (!origin || !destination) {
      return NextResponse.json(
        { ok: false, error: 'Provide both origin and destination.' },
        { status: 400 }
      );
    }

    const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!API_KEY) {
      return NextResponse.json(
        { ok: false, error: 'Google Maps API key not configured on server.' },
        { status: 500 }
      );
    }

    // Use the Routes API with truck-friendly settings
    const body = {
      origin: { address: origin },
      destination: { address: destination },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_UNAWARE',
      routeModifiers: {
        avoidFerries: true,
        avoidHighways: false,
        avoidTolls: false,
      },
      units: 'IMPERIAL',
    };

    const resp = await fetch(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': API_KEY,
          'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
        },
        body: JSON.stringify(body),
      }
    );

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json(
        { ok: false, error: `Routes API error (${resp.status}): ${text}` },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    const route = data.routes?.[0];

    if (!route) {
      return NextResponse.json(
        { ok: false, error: 'No route found between these locations.' },
        { status: 400 }
      );
    }

    const meters = route.distanceMeters || 0;
    const miles = Math.round(meters * 0.000621371 * 10) / 10;
    const polyline = route.polyline?.encodedPolyline || '';

    return NextResponse.json({
      ok: true,
      miles,
      polyline,
      durationSeconds: parseInt(route.duration) || 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
