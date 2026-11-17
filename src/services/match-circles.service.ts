import { clubsService } from '@/services/clubs.service';
import { communitiesService } from '@/services/communities.service';
import { friendOf, friendshipsService } from '@/services/friendships.service';
import type { PlayerSummary } from '@/types/api';

export const circleOptions = [
  { key: 'friends', label: 'Pongmigos' },
  { key: 'community', label: 'Comunidad' },
  { key: 'club', label: 'Club' },
] as const;

export type Circle = typeof circleOptions[number]['key'];
export type MatchRival = {
  id: number;
  name: string;
  player?: PlayerSummary;
  groupId?: number;
  groupName?: string;
};

export async function matchRivals(circle: Circle, playerId: number, signal: AbortSignal): Promise<MatchRival[]> {
  if (!playerId) return [];
  if (circle === 'friends') {
    const friends = await friendshipsService.accepted(playerId, signal);
    return friends.map((entry) => {
      const player = friendOf(entry, playerId);
      return { id: player.id, name: player.name, player };
    });
  }
  const rivals = new Map<number, MatchRival>();
  if (circle === 'club') {
    const [memberships, managed] = await Promise.all([clubsService.memberships(playerId, signal), clubsService.managed(signal)]);
    const clubs = new Map(managed.map(({ id, name }) => [id, name]));
    for (const entry of memberships) if (entry.status === 'APPROVED') clubs.set(entry.clubId, entry.clubName);
    for (const [id, name] of clubs) {
      const members = await clubsService.allMembers(id, signal);
      for (const { player } of members) {
        if (player && player.id !== playerId) rivals.set(player.id, { id: player.id, name: player.name, player, groupId: id, groupName: name });
      }
    }
  } else {
    const communities = await communitiesService.mine(signal);
    for (const community of communities) {
      for (let page = 0; ; page++) {
        const result = await communitiesService.members(community.id, { page, size: 50 }, signal);
        for (const member of result.content) {
          if (member.playerId !== playerId) rivals.set(member.playerId, { id: member.playerId, name: member.playerName, groupId: community.id, groupName: community.name });
        }
        if (result.last) break;
      }
    }
  }
  return [...rivals.values()];
}
