declare namespace google.maps {
  class Map {
    constructor(el: HTMLElement, opts?: MapOptions);
    fitBounds(bounds: LatLngBounds, padding?: number | { top: number; right: number; bottom: number; left: number }): void;
    setCenter(latlng: LatLngLiteral): void;
    setZoom(zoom: number): void;
  }

  class LatLngBounds {
    constructor();
    extend(point: LatLng | LatLngLiteral): LatLngBounds;
    union(other: LatLngBounds): LatLngBounds;
  }

  class DirectionsService {
    route(request: DirectionsRequest, callback: (result: DirectionsResult | null, status: string) => void): void;
  }

  class DirectionsRenderer {
    constructor(opts?: DirectionsRendererOptions);
    setMap(map: Map | null): void;
    setDirections(result: DirectionsResult): void;
  }

  class Marker {
    constructor(opts?: MarkerOptions);
    setMap(map: Map | null): void;
  }

  interface MapOptions {
    center?: LatLngLiteral;
    zoom?: number;
    mapTypeId?: string;
    disableDefaultUI?: boolean;
    zoomControl?: boolean;
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    fullscreenControl?: boolean;
    styles?: MapTypeStyle[];
  }

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  interface LatLng {
    lat(): number;
    lng(): number;
  }

  interface DirectionsRequest {
    origin: string | LatLngLiteral;
    destination: string | LatLngLiteral;
    travelMode: string;
    avoidFerries?: boolean;
    avoidHighways?: boolean;
  }

  interface DirectionsResult {
    routes: DirectionsRoute[];
  }

  interface DirectionsRoute {
    bounds: LatLngBounds;
    overview_path: LatLng[];
    legs: DirectionsLeg[];
  }

  interface DirectionsLeg {
    start_location: LatLng;
    end_location: LatLng;
  }

  interface DirectionsRendererOptions {
    map?: Map;
    directions?: DirectionsResult;
    suppressMarkers?: boolean;
    preserveViewport?: boolean;
    polylineOptions?: PolylineOptions;
  }

  interface PolylineOptions {
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
    icons?: IconSequence[];
  }

  interface IconSequence {
    icon: Symbol;
    offset?: string;
    repeat?: string;
  }

  interface Symbol {
    path: string | number;
    scale?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
    fillColor?: string;
    fillOpacity?: number;
  }

  interface MarkerOptions {
    position: LatLngLiteral | LatLng;
    map?: Map;
    label?: string | MarkerLabel;
    icon?: string | MarkerIcon;
    zIndex?: number;
  }

  interface MarkerLabel {
    text: string;
    color?: string;
    fontWeight?: string;
    fontSize?: string;
  }

  interface MarkerIcon {
    path: number;
    fillColor?: string;
    fillOpacity?: number;
    strokeColor?: string;
    strokeWeight?: number;
    scale?: number;
    labelOrigin?: { x: number; y: number };
  }

  interface MapTypeStyle {
    elementType?: string;
    featureType?: string;
    stylers: { [key: string]: string | number }[];
  }

  const TravelMode: {
    DRIVING: string;
    BICYCLING: string;
    TRANSIT: string;
    WALKING: string;
  };

  const DirectionsStatus: {
    OK: string;
    NOT_FOUND: string;
    ZERO_RESULTS: string;
    MAX_WAYPOINTS_EXCEEDED: string;
    OVER_QUERY_LIMIT: string;
    REQUEST_DENIED: string;
    UNKNOWN_ERROR: string;
  };

  const SymbolPath: {
    CIRCLE: number;
    FORWARD_CLOSED_ARROW: number;
    FORWARD_OPEN_ARROW: number;
    BACKWARD_CLOSED_ARROW: number;
    BACKWARD_OPEN_ARROW: number;
  };

  // For creating a Point
  class Point {
    constructor(x: number, y: number);
    x: number;
    y: number;
  }
}

declare namespace google.maps.places {
  class Autocomplete {
    constructor(input: HTMLInputElement, opts?: AutocompleteOptions);
    getPlace(): PlaceResult;
    addListener(event: string, handler: () => void): void;
  }

  interface AutocompleteOptions {
    types?: string[];
    componentRestrictions?: { country: string | string[] };
    fields?: string[];
  }

  interface PlaceResult {
    formatted_address?: string;
    name?: string;
    geometry?: {
      location: { lat(): number; lng(): number };
    };
  }
}
