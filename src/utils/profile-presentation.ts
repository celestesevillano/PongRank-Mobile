export const NETWORKS = {
  instagram: { label: 'Instagram', host: 'instagram.com' },
  tiktok: { label: 'TikTok', host: 'tiktok.com' },
  facebook: { label: 'Facebook', host: 'facebook.com' },
} as const;

export type Network = keyof typeof NETWORKS;
export type ProfilePresentation = {
  city: string;
  description: string;
  photo: string | null;
  links: Record<Network, string>;
};

export const EMPTY_PROFILE: ProfilePresentation = {
  city: '', description: '', photo: null, links: { instagram: '', tiktok: '', facebook: '' },
};

export function normalizeSocialLink(value: string, network: Network) {
  const raw = value.trim();
  if (!raw) return '';
  const url = new URL(raw.includes('://') ? raw : `https://${raw}`);
  const host = NETWORKS[network].host;
  if (
    url.protocol !== 'https:' || url.username || url.password || url.port ||
    (url.hostname !== host && !url.hostname.endsWith(`.${host}`)) || url.pathname === '/'
  ) {
    throw new Error('Enlace de red social inválido.');
  }
  url.hash = '';
  return url.toString();
}

export type ProfilePresentationResponse = {
  name: string;
  city: string | null;
  description: string | null;
  photo: string | null;
  instagram: string | null;
  tiktok: string | null;
  facebook: string | null;
};

export function toProfilePresentation(data: ProfilePresentationResponse): ProfilePresentation {
  return {
    city: data.city ?? '',
    description: data.description ?? '',
    photo: data.photo ?? null,
    links: { instagram: data.instagram ?? '', tiktok: data.tiktok ?? '', facebook: data.facebook ?? '' },
  };
}
