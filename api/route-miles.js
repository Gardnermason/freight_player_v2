// api/route-miles.js
// Vercel serverless function — v3.1.1 (ZIP/city/coords autodetect + HighwayOnly logic)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { stops, devKey } = req.body || {};
    if (!Array.isArray(stops) || stops.length < 2) {
      return res.status(400).json({ error: 'At least two stops are required.' });
    }

    const API_KEY = process.env.TRIMBLE_API_KEY || (devKey || '').trim();
    if (!API_KEY) {
      return res.status(500).json({ error: 'Server API key not configured.' });
    }

    // Parse a user-entered stop into the shape Trimble expects (no regex in this function to keep deployment tooling happy)
    function parseStop(raw) {
      const s = String(raw).trim();

      // 1) Lat,Lng (e.g., "41.8818, -87.6231")
      const commaIdx = s.indexOf(',');
      if (commaIdx !== -1) {
        const lat = parseFloat(s.slice(0, commaIdx).trim());
        const lon = parseFloat(s.slice(commaIdx + 1).trim());
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          return { Coords: { Lat: lat, Lon: lon } };
        }
      }

      // 2) ZIP (5 or 9 with dash)
      const digits = s.split('-').join('');
      const allDigits = digits.length > 0 && digits.split('').every(ch => ch >= '0' && ch <= '9');
      const isZip5 = s.length === 5 && allDigits && digits.length === 5;
      const isZip9 = s.length === 10 && s[5] === '-' && allDigits && digits.length === 9;
      if (isZip5 || isZip9) {
        return { Address: { Zip: s, Country: 'United States', CountryPostalFilter: 'Us' } };
      }

      // 3) City, ST (two-letter state)
      if (s.includes(',')) {
        const parts = s.split(',');
        const city = parts[0] ? parts[0].trim() : '';
        const state = parts[1] ? parts[1].trim().toUpperCase() : '';
        const isTwoLetters = state.length === 2 && state.split('').every(ch => ch >= 'A' && ch <= 'Z');
        if (city && isTwoLetters) {
          return { Address: { City: city, State: state, Country: 'United States' } };
        }
      }

      // 4) Fallback to full street address
      return { Address: { StreetAddress: s } };
    }

    const parsedStops = stops.map((s, i) => ({ Label: `Stop ${i + 1}`, ...parseStop(s) }));

    // If all stops are ZIP/city-only (no street), HighwayOnly is recommended for rating
    const isCityOrZipOnly = parsedStops.every(st => st.Address && !st.Address.StreetAddress);

    const body = {
      ReportRoutes: [
        {
          Stops: parsedStops,
          RouteOptions: {
            VehicleType: 0,       // Truck
            RoutingType: 0,       // Practical
            HighwayOnly: isCityOrZipOnly,
            DistanceUnits: 0      // Miles
          },
          ReportTypes: [
            { __type: 'MileageReportType:http://pcmiler.alk.com/APIs/v1.0', TimeInSeconds: false },
            { __type: 'RoutePathReportType:http://pcmiler.alk.com/APIs/v1.0' }
          ]
        }
      ]
    };

    const resp = await fetch(
      'https://pcmiler.alk.com/apis/rest/v1.0/Service.svc/route/routeReports?dataVersion=Current',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': API_KEY
        },
        body: JSON.stringify(body)
      }
    );

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({ error: 'Trimble error', details: text });
    }

    const data = await resp.json();

    let miles = 0;
    let geometry = null;
    let resolvedStops = [];

    const reports = Array.isArray(data) ? data : data?.Reports || [];
    for (const r of reports) {
      const type = r.__type || '';
      if (type.includes('MileageReport')) {
        const lines = r.MileageReportLines || r.Lines || [];
        if (Array.isArray(lines) && lines.length > 0) {
          const last = lines[lines.length - 1];
          miles = Number(last?.TMiles) || lines.reduce((acc, L) => acc + (Number(L?.LMiles) || 0), 0);
          resolvedStops = lines.map(L => ({
            Label: L?.Stop?.Label || '',
            Lon: Number(L?.Stop?.Coords?.Lon),
            Lat: Number(L?.Stop?.Coords?.Lat)
          })).filter(s => !Number.isNaN(s.Lat) && !Number.isNaN(s.Lon));
        }
      }
      if (type.includes('RoutePathReport')) {
        if (r?.Geometry?.type === 'LineString' && Array.isArray(r?.Geometry?.coordinates)) {
          geometry = r.Geometry;
        } else if (Array.isArray(r?.GeoPoints)) {
          geometry = { type: 'LineString', coordinates: r.GeoPoints.map(p => [Number(p.Lon), Number(p.Lat)]) };
        }
      }
    }

    return res.status(200).json({ miles, geometry, stops: resolvedStops });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', details: String(err) });
  }
}
