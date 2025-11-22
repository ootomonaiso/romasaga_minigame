import { useMemo, useState } from 'react';
import type { GameState, Property } from '../types/game';
import { calculateGroupFunding } from '../data/gameState';
import { useNotifications } from '../context/NotificationContext';

interface GroupTechniqueViewProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

interface DecoratedMember {
  id: string;
  name: string;
  cityName: string;
  ownedByPlayer: boolean;
  rivalOwned: boolean;
}

interface DecoratedTechnique {
  id: string;
  name: string;
  description: string;
  baseAmount: number;
  isUnlocked: boolean;
  ownedCount: number;
  totalCount: number;
  progressPercent: number;
  potentialFunding: number;
  members: DecoratedMember[];
}

export const GroupTechniqueView = ({ gameState, setGameState }: GroupTechniqueViewProps) => {
  const { notify } = useNotifications();
  const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const cityNameMap = useMemo(() => {
    const map = new Map<string, string>();
    gameState.cities.forEach(city => map.set(city.id, city.name));
    return map;
  }, [gameState.cities]);

  const decoratedTechniques = useMemo<DecoratedTechnique[]>(() => {
    const propertyMap = new Map<string, Property>();
    gameState.properties.forEach(property => propertyMap.set(property.id, property));

    return gameState.groupTechniques.map(tech => {
      const members = tech.propertyIds
        .map(id => propertyMap.get(id))
        .filter((prop): prop is Property => Boolean(prop))
        .map(prop => ({
          id: prop.id,
          name: prop.name,
          cityName: cityNameMap.get(prop.cityId) ?? prop.cityId,
          ownedByPlayer: prop.ownerId === 'player',
          rivalOwned: prop.ownerId !== null && prop.ownerId !== 'player',
        }));

      const ownedCount = members.filter(member => member.ownedByPlayer).length;
      const totalCount = members.length;
      const ownershipRatio = totalCount === 0 ? 0 : ownedCount / totalCount;
      const progressPercent = Math.round(ownershipRatio * 100);

      return {
        id: tech.id,
        name: tech.name,
        description: tech.description,
        baseAmount: tech.baseAmount,
        isUnlocked: tech.isUnlocked,
        ownedCount,
        totalCount,
        progressPercent,
        potentialFunding: Math.floor(tech.baseAmount * ownershipRatio),
        members,
      };
    });
  }, [gameState.groupTechniques, gameState.properties, cityNameMap]);

  const unlockedCount = decoratedTechniques.filter(tech => tech.isUnlocked).length;
  const lockedCount = decoratedTechniques.length - unlockedCount;
  const potentialTotalFunding = decoratedTechniques.reduce((sum, tech) => sum + tech.potentialFunding, 0);

  const nextUnlockCandidate = useMemo(() => {
    return decoratedTechniques
      .filter(tech => !tech.isUnlocked)
      .sort((a, b) => b.progressPercent - a.progressPercent)[0];
  }, [decoratedTechniques]);

  const filteredTechniques = useMemo(() => {
    return decoratedTechines => decoratedTechines
  }, [])
}
