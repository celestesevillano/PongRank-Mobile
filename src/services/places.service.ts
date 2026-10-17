import axios from 'axios';

import type { Coordinates } from '@/services/matches.service';

const PLACES_URL = 'https://places.googleapis.com/v1';
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY;

export type PlaceSuggestion = { placeId: string; description: string };

export const placesAvailable = Boolean(API_KEY);

const client = axios.create({ baseURL: PLACES_URL, timeout: 10000, headers: { 'X-Goog-Api-Key': API_KEY ?? '' } });

export const placesService = {
  async autocomplete(input: string, signal?: AbortSignal): Promise<PlaceSuggestion[]> {
    const { data } = await client.post('/places:autocomplete', { input, languageCode: 'es', includedRegionCodes: ['pe'] }, { signal });
    return (data.suggestions ?? [])
      .filter((item: { placePrediction?: unknown }) => item.placePrediction)
      .map((item: { placePrediction: { placeId: string; text: { text: string } } }) => ({
        placeId: item.placePrediction.placeId,
        description: item.placePrediction.text.text,
      }));
  },

  async coordinates(placeId: string, signal?: AbortSignal): Promise<Coordinates> {
    const { data } = await client.get(`/places/${placeId}`, { headers: { 'X-Goog-FieldMask': 'location' }, signal });
    return { latitude: data.location.latitude, longitude: data.location.longitude };
  },
};
