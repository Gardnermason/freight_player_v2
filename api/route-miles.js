import { Buffer } from 'buffer';

// Route handler for Vercel/Next API
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  try {
    const { locations } = req.body || {};
    if (!Array.isArray(locations) || locations.length < 2) {
      return res.status(400).json({ ok: false, error: 'Provide at least origin and destination.' });
    }

    // Use your Web Services key from env var
    const API_KEY = process.env.TRIMBLE_API_KEY || '';
    if (!API_KEY) {
      return res.status(500).json({ ok: false, error: 'Server API key not configured.' });
    }

    // Build Stops for routeReports call
    const stopsForReports = locations.map((loc) => ({
      Address: { StreetAddress: loc, Country: 'US' },
      Region: 4, // North America
    }));
    // Build body for routeReports (mileage + route path)
    const reportsBody = {
      ReportRoutes: [{
        Stops: stopsForReports,
        Options: {
          VehicleType: 0,    // Truck
          RoutingType: 0,    // Practical
          DistanceUnits: 0,  // Miles
          HighwayOnly: false,
          TollDiscourage: false,
          HazMatType: 0
        },
        ReportTypes: [
          { __type: 'MileageReportType:http://pcmiler.alk.com/APIs/v1.0', TimeInSeconds: false },
          { __type: 'RoutePathReportType:http://pcmiler.alk.com/APIs/v1.0' }
        ]
      }]
    };

    const reportsResp = await fetch(
      'https://pcmiler.alk.com/apis/rest/v1.0/Service.svc/route/routeReports?dataVersion=Current',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': API_KEY },
        body: JSON.stringify(reportsBody)
      }
    );
    if (!reportsResp.ok) {
      const text = await reportsResp.text();
      return res.status(reportsResp.status).json({ ok: false, error: `Trimble error: ${text}` });
    }
    const reportsData = await reportsResp.json();

    // Extract miles and coordinates
    let miles = 0;
    let routeCoords = [];
    const reports = Array.isArray(reportsData) ? reportsData : reportsData?.Reports || [];
    reports.forEach((r) => {
      const type = r.__type || '';
      if (type.includes('MileageReport')) {
        const lines = r.MileageReportLines || r.Lines || [];
        if (Array.isArray(lines) && lines.length) {
          const last = lines[lines.length - 1];
          miles = Number(last?.TMiles) || miles;
        }
      }
      if (type.includes('RoutePathReport')) {
      const points = (r?.Geometry?.coordinates) ? r.Geometry.coordinates :
                    (r?.Geometry?.type === 'LineString' && Array.isArray(r?.Geometry?.coordinates)) ? r.Geometry.coordinates :
                    (r?.GeoPoints || []).map((p) => [Number(p.Lon), Number(p.Lat)]);
        routeCoords = points;
      }
    });

    // Build body for static map (Map Routes API)
    const resolvedStops = routeCoords.length
      ? routeCoords.map((p, i) => ({
          Lat: p[1],
          Lon: p[0]
        }))
      : [];

    // Use the stops array to draw pins; fallback to original locations if coords missing
    const pinPoints = resolvedStops.length
      ? resolvedStops.map((pt, i) => ({
          Point: { Lat: pt.Lat, Lon: pt.Lon },
          Image: i === 0 ? 'ltruck_r' :
                 (i === resolvedStops.length - 1 ? 'lbldg_bl' : 'waypoint')
        }))
      : locations.map((loc, i) => ({
          Point: { Lat: 0, Lon: 0 },
          Image: i === 0 ? 'ltruck_r' : (i === locations.length - 1 ? 'lbldg_bl' : 'waypoint')
        }));

    const mapBody = {
      Map: {
        Viewport: {
          Center: null,
          ScreenCenter: null,
          ZoomRadius: 0,
          CornerA: null,
          CornerB: null,
          Region: 0
        },
        Projection: 0,
        Style: 0,
        ImageOption: 0,
        Width: 400,
        Height: 400,
        Drawers: [8, 2, 7, 17, 15],
        LegendDrawer: [{ Type: 0, DrawOnMap: true }],
        GeometryDrawer: null,
        PinDrawer: { Pins: pinPoints },
        PinCategories: null,
        TrafficDrawer: null,
        MapLayering: 0,
        Language: null,
        ImageSource: null
      },
      Routes: [{
        Stops: stopsForReports.map((stop) => ({
          Address: stop.Address,
          Coords: null,
          Region: 4
        })),
        Options: {
          VehicleType: 0,
          RoutingType: 0,
          DistanceUnits: 0,
          HighwayOnly: false,
          TollDiscourage: false,
          HazMatType: 0
        },
        DrawLeastCost: false,
        RouteLegOptions: null,
        StopLabelDrawer: 0
      }]
    };

    const mapResp = await fetch(
      'https://pcmiler.alk.com/apis/rest/v1.0/Service.svc/mapRoutes?dataset=Current',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': API_KEY },
        body: JSON.stringify(mapBody)
      }
    );
    const imgBuffer = await mapResp.arrayBuffer();
    const staticMapUrl = `data:image/png;base64,${Buffer.from(imgBuffer).toString('base64')}`;

    return res.status(200).json({ ok: true, miles, staticMapUrl });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Server error' });
  }
}
