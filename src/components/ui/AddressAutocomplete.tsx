import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, ExternalLink, X, Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

const US_STATE_MAP: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
  'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
  'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
  'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
  'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
  'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
  'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
  'district of columbia': 'DC', 'puerto rico': 'PR',
};

export function normalizeUsState(stateStr: string): string {
  if (!stateStr) return '';
  const clean = stateStr.trim();
  if (clean.length === 2) return clean.toUpperCase();
  const lower = clean.toLowerCase();
  return US_STATE_MAP[lower] || clean.substring(0, 2).toUpperCase();
}

export function parseUsAddressString(displayName: string): { street: string; city: string; state: string; zip: string } {
  const parts = displayName.split(',').map((s) => s.trim());
  let street = parts[0] || '';
  let city = '';
  let state = '';
  let zip = '';

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (part === 'USA' || part === 'United States') continue;

    // Match state code and 5-digit zip e.g., "GA 30303"
    const matchStateZip = part.match(/([A-Z]{2})\s+(\d{5}(-\d{4})?)/i);
    if (matchStateZip) {
      state = normalizeUsState(matchStateZip[1]);
      zip = matchStateZip[2];
      if (i > 1 && !city) city = parts[i - 1];
      continue;
    }

    // Match 5-digit zip only
    const matchZipOnly = part.match(/^(\d{5}(-\d{4})?)$/);
    if (matchZipOnly) {
      zip = matchZipOnly[1];
      continue;
    }

    // Match state name or 2-letter abbreviation
    const matchState = normalizeUsState(part);
    if (matchState && US_STATE_MAP[part.toLowerCase()]) {
      state = matchState;
      if (i > 1 && !city) city = parts[i - 1];
    } else if (i === 1 && !city) {
      city = part;
    } else if (i === 2 && !city && parts.length > 3) {
      city = part;
    }
  }

  // Fallback city assignment if 2nd element is city
  if (!city && parts.length >= 2 && parts[1] !== 'USA' && parts[1] !== 'United States') {
    city = parts[1];
  }

  return { street, city, state, zip };
}

export interface AddressData {
  address: string;
  city: string;
  state: string;
  zip: string;
  fullAddress: string;
}

interface AddressAutocompleteProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onSelectAddress?: (data: AddressData) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
  className?: string;
}

interface Suggestion {
  display_name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  place_id?: string;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  label,
  value,
  onChange,
  onSelectAddress,
  placeholder = 'Enter street address…',
  required = false,
  disabled = false,
  hint,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<any>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamically load Google Maps Places API if API key is provided
  useEffect(() => {
    const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || (window as any).GOOGLE_MAPS_API_KEY;
    if (apiKey && !(window as any).google?.maps?.places) {
      const existingScript = document.getElementById('google-maps-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        document.head.appendChild(script);
      }
    }
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);

    try {
      const google = (window as any).google;
      if (google?.maps?.places?.AutocompleteService) {
        const service = new google.maps.places.AutocompleteService();
        service.getPlacePredictions(
          {
            input: query,
            componentRestrictions: { country: 'us' },
            types: ['address'],
          },
          (predictions: any[], status: string) => {
            if (status === 'OK' && predictions && predictions.length > 0) {
              const formatted: Suggestion[] = predictions.map((p) => {
                const parsed = parseUsAddressString(p.description);
                return {
                  display_name: p.description,
                  street: p.structured_formatting?.main_text || parsed.street || p.description,
                  city: parsed.city,
                  state: parsed.state,
                  zip: parsed.zip,
                  place_id: p.place_id,
                };
              });
              setSuggestions(formatted);
              setIsOpen(true);
            } else {
              fallbackFetchNominatim(query);
            }
            setLoading(false);
          }
        );
        return;
      }

      await fallbackFetchNominatim(query);
    } catch (err) {
      console.error('Address autocomplete search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fallbackFetchNominatim = async (query: string) => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&addressdetails=1&limit=6&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en-US,en;q=0.9' },
      });
      if (res.ok) {
        const data = await res.json();
        const formatted: Suggestion[] = data.map((item: any) => {
          const addr = item.address || {};
          const houseNum = addr.house_number || '';
          const road = addr.road || addr.street || addr.pedestrian || '';
          const street = [houseNum, road].filter(Boolean).join(' ') || item.display_name.split(',')[0];
          const parsed = parseUsAddressString(item.display_name);

          const city = addr.city || addr.town || addr.village || addr.city_district || addr.county || parsed.city || '';
          const state = normalizeUsState(addr.state || parsed.state || '');
          const zip = addr.postcode || parsed.zip || '';

          return {
            display_name: item.display_name,
            street,
            city,
            state,
            zip,
          };
        });
        setSuggestions(formatted);
        setIsOpen(formatted.length > 0);
      }
    } catch (e) {
      console.error('Nominatim geocoding error:', e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 300);
  };

  const handleSelectSuggestion = (s: Suggestion) => {
    const google = (window as any).google;

    // If Google Places Details API is available, fetch complete address components
    if (s.place_id && google?.maps?.places?.PlacesService) {
      try {
        const dummy = document.createElement('div');
        const service = new google.maps.places.PlacesService(dummy);
        service.getDetails(
          { placeId: s.place_id, fields: ['address_components', 'formatted_address'] },
          (place: any, status: string) => {
            if (status === 'OK' && place?.address_components) {
              let streetNum = '';
              let route = '';
              let city = '';
              let state = '';
              let zip = '';

              for (const comp of place.address_components) {
                const types = comp.types || [];
                if (types.includes('street_number')) streetNum = comp.long_name;
                if (types.includes('route')) route = comp.short_name || comp.long_name;
                if (types.includes('locality')) city = comp.long_name;
                else if (!city && types.includes('sublocality_level_1')) city = comp.long_name;
                else if (!city && types.includes('administrative_area_level_2')) city = comp.long_name;
                if (types.includes('administrative_area_level_1')) state = comp.short_name;
                if (types.includes('postal_code')) zip = comp.long_name;
              }

              const street = [streetNum, route].filter(Boolean).join(' ') || place.formatted_address.split(',')[0];
              const parsedData: AddressData = {
                address: street,
                city: city || s.city,
                state: normalizeUsState(state || s.state),
                zip: zip || s.zip,
                fullAddress: place.formatted_address || s.display_name,
              };

              onChange(parsedData.address);
              if (onSelectAddress) onSelectAddress(parsedData);
              setIsOpen(false);
              return;
            }
          }
        );
      } catch (err) {
        console.error('Failed to get Google Place details:', err);
      }
    }

    // Direct selection fallback
    const parsed = parseUsAddressString(s.display_name);
    const selectedData: AddressData = {
      address: s.street || parsed.street || s.display_name.split(',')[0],
      city: s.city || parsed.city,
      state: normalizeUsState(s.state || parsed.state),
      zip: s.zip || parsed.zip,
      fullAddress: s.display_name,
    };

    onChange(selectedData.address);
    if (onSelectAddress) onSelectAddress(selectedData);
    setIsOpen(false);
  };

  const openGoogleMapsPreview = () => {
    if (!value.trim()) return;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value + ', USA')}`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <label className="text-[11.5px] font-medium text-fg-2 flex items-center justify-between">
          <span>
            {label}
            {required && <span className="text-danger ml-0.5">*</span>}
          </span>
          {value.trim() && (
            <button
              type="button"
              onClick={openGoogleMapsPreview}
              title="View address on Google Maps"
              className="text-[10.5px] text-accent font-semibold flex items-center gap-1 hover:underline"
            >
              <MapPin size={11} /> Google Maps <ExternalLink size={10} />
            </button>
          )}
        </label>
      )}

      <div ref={wrapRef} className="relative">
        <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-accent pointer-events-none" />

        <input
          ref={inputRef}
          type="text"
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          className={cn(
            'w-full h-[33px] pl-8 pr-8 bg-surface border border-bd rounded-ctl text-[12.5px] text-fg placeholder:text-fg-3',
            'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors',
            disabled && 'opacity-60 cursor-not-allowed bg-surface-2'
          )}
        />

        {loading ? (
          <Loader2 size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-accent animate-spin" />
        ) : value ? (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setSuggestions([]);
              setIsOpen(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-3 hover:text-fg transition-colors"
          >
            <X size={13} />
          </button>
        ) : null}

        {/* Suggestions Dropdown */}
        {isOpen && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-[220px] overflow-y-auto rounded-card bg-surface border border-bd shadow-lift">
            <div className="px-3 py-1.5 bg-surface-2 border-b border-bd flex items-center justify-between text-[10.5px] font-bold text-fg-3 uppercase tracking-wider">
              <span>US Address Suggestions</span>
              <span className="text-accent flex items-center gap-1"><MapPin size={10} /> Google Maps</span>
            </div>
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSuggestion(s)}
                className="w-full text-left px-3 py-2 text-[12px] hover:bg-surface-2 transition-colors border-b border-bd last:border-b-0 space-y-0.5"
              >
                <p className="font-semibold text-fg flex items-center gap-1.5">
                  <MapPin size={12} className="text-accent shrink-0" />
                  <span className="truncate">{s.street || s.display_name.split(',')[0]}</span>
                </p>
                <p className="text-[11px] text-fg-3 truncate pl-4">
                  {[s.city, s.state, s.zip].filter(Boolean).join(', ')} {s.display_name.includes('United States') ? '' : '• USA'}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {hint && <p className="text-[10.5px] text-fg-3">{hint}</p>}
    </div>
  );
};
