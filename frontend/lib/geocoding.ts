/**
 * Utility functions for OpenStreetMap Nominatim Geocoding and Reverse-Geocoding.
 */

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
  formattedAddress: string;
}

/**
 * Formats OpenStreetMap / Nominatim structured address into a clean, human-readable street address.
 */
export function formatNominatimAddress(data: any): string {
  if (!data) return '';

  if (data.address) {
    const addr = data.address;
    const parts: string[] = [];

    // Specific Point of Interest / Landmark / Building
    const poi = addr.amenity || addr.building || addr.shop || addr.office || addr.tourism || addr.leisure;
    if (poi) parts.push(poi);

    // Street & House Number
    if (addr.house_number && addr.road) {
      parts.push(`${addr.house_number} ${addr.road}`);
    } else if (addr.road) {
      parts.push(addr.road);
    } else if (addr.house_number) {
      parts.push(addr.house_number);
    }

    // Neighborhood, Block, Suburb, Colony or District
    const sub =
      addr.neighbourhood ||
      addr.suburb ||
      addr.residential ||
      addr.quarter ||
      addr.commercial ||
      addr.subdivision;
    if (sub && !parts.includes(sub)) {
      parts.push(sub);
    }

    // Town, City District, or City
    const city = addr.town || addr.city_district || addr.city || addr.municipality;
    if (city && !parts.includes(city)) {
      parts.push(city);
    }

    if (parts.length > 0) {
      const combined = parts.join(', ');
      return combined.length > 250 ? combined.substring(0, 247) + '...' : combined;
    }
  }

  // Fallback to display_name
  const display = data.display_name || '';
  return display.length > 250 ? display.substring(0, 247) + '...' : display;
}

/**
 * Searches coordinates by address query string using OpenStreetMap Nominatim API.
 */
export async function searchAddressNominatim(query: string): Promise<GeocodeResult | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    trimmed
  )}&limit=1&addressdetails=1&accept-language=en`;

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Nominatim geocoding failed (Status ${res.status})`);
  }

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const first = data[0];
  const lat = parseFloat(first.lat);
  const lng = parseFloat(first.lon);

  if (isNaN(lat) || isNaN(lng)) {
    return null;
  }

  return {
    lat,
    lng,
    displayName: first.display_name || '',
    formattedAddress: formatNominatimAddress(first),
  };
}

/**
 * Reverse geocodes latitude & longitude into a human-readable street address using Nominatim API.
 */
export async function reverseGeocodeNominatim(lat: number, lng: number): Promise<GeocodeResult | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en`;

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Nominatim reverse geocode failed (Status ${res.status})`);
  }

  const data = await res.json();
  if (!data || data.error) {
    return null;
  }

  return {
    lat: parseFloat(data.lat || String(lat)),
    lng: parseFloat(data.lon || String(lng)),
    displayName: data.display_name || '',
    formattedAddress: formatNominatimAddress(data),
  };
}
