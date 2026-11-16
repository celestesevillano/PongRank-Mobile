import { SocialBanner } from '@/components/social/social-banner';

export function CommunitiesBanner({ communityCount, used, limit }: {
  communityCount?: number;
  used?: number;
  limit?: number;
}) {
  const count = communityCount === undefined ? undefined
    : `${communityCount} ${communityCount === 1 ? 'comunidad' : 'comunidades'}`;
  const quota = used !== undefined && limit !== undefined ? `${used} de ${limit} espacios usados` : count;

  return <SocialBanner kind="communities" subtitle={quota} />;
}
