import { useMemo, useState } from 'react';
import type { GameState, Property } from '../types/game';
import { calculateGroupFunding } from '../data/gameState';
import { useNotifications } from '../context/NotificationContext';

type FilterStatus = 'all' | 'unlocked' | 'locked';

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

const statusFilters: { label: string; value: FilterStatus }[] = [
  { label: 'すべて', value: 'all' },
  { label: '習得済み', value: 'unlocked' },
  { label: '未習得', value: 'locked' },
];

export const GroupTechniqueView = ({ gameState, setGameState }: GroupTechniqueViewProps) => {
  const { notify } = useNotifications();
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
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
  const potentialTotalFunding = useMemo(() => {
    return decoratedTechniques
      .filter(tech => tech.isUnlocked)
      .reduce(
        (sum, tech) => sum + calculateGroupFunding(tech.id, gameState.groupTechniques, gameState.player.ownedProperties),
        0
      );
  }, [decoratedTechniques, gameState.groupTechniques, gameState.player.ownedProperties]);

  const nextUnlockCandidate = useMemo(() => {
    return decoratedTechniques
      .filter(tech => !tech.isUnlocked)
      .sort((a, b) => b.progressPercent - a.progressPercent)[0];
  }, [decoratedTechniques]);

  const filteredTechniques = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return decoratedTechniques
      .filter(tech => {
        if (statusFilter === 'locked' && tech.isUnlocked) return false;
        if (statusFilter === 'unlocked' && !tech.isUnlocked) return false;
        if (term) {
          const haystack = `${tech.name}${tech.description}`.toLowerCase();
          if (!haystack.includes(term)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.isUnlocked !== b.isUnlocked) {
          return a.isUnlocked ? -1 : 1;
        }
        return b.progressPercent - a.progressPercent;
      });
  }, [decoratedTechniques, statusFilter, searchTerm]);

  const handleRequestFunds = (tech: DecoratedTechnique) => {
    if (!tech.isUnlocked) {
      notify('info', 'まずはグループ技を習得しましょう');
      return;
    }

    if (tech.ownedCount === 0) {
      notify('warning', '関連する物件を所有していません');
      return;
    }

    const amount = calculateGroupFunding(tech.id, gameState.groupTechniques, gameState.player.ownedProperties);
    if (amount <= 0) {
      notify('warning', '今回は支援を得られませんでした');
      return;
    }

    setGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        capital: prev.player.capital + amount,
      },
    }));

    notify('success', `${tech.name} から ${amount.toLocaleString()} G を獲得しました！`);
  };

  const highlightMessage = nextUnlockCandidate
    ? `${nextUnlockCandidate.ownedCount}/${nextUnlockCandidate.totalCount} 件所有`
    : 'すべて習得済み';

  return (
    <section className="group-techniques-view">
      <header className="group-tech-summary">
        <div>
          <h2>🔗 グループ技</h2>
          <p>グループとの繋がりを強めて一括で資金を調達しましょう</p>
        </div>
        <div className="group-stat-grid">
          <article className="group-stat-card">
            <span>習得済み</span>
            <strong>{unlockedCount} / {decoratedTechniques.length}</strong>
          </article>
          <article className="group-stat-card">
            <span>未習得</span>
            <strong>{lockedCount}</strong>
          </article>
          <article className="group-stat-card">
            <span>即時獲得可能額</span>
            <strong>{potentialTotalFunding.toLocaleString()} G</strong>
          </article>
          <article className="group-stat-card accent">
            <span>注目グループ</span>
            <strong>{nextUnlockCandidate ? nextUnlockCandidate.name : '達成済み'}</strong>
            <p>{highlightMessage}</p>
          </article>
        </div>
      </header>

      <div className="group-tech-controls">
        <div className="status-toggle">
          {statusFilters.map(filter => (
            <button
              key={filter.value}
              className={statusFilter === filter.value ? 'active' : ''}
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="グループ名で検索"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      {filteredTechniques.length === 0 ? (
        <p className="empty-state">該当するグループ技がありません</p>
      ) : (
        <div className="group-tech-grid">
          {filteredTechniques.map(tech => {
            const visibleMembers = tech.members.slice(0, 4);
            const remainingMembers = tech.members.length - visibleMembers.length;
            const remainingProperties = Math.max(0, tech.totalCount - tech.ownedCount);

            return (
              <article key={tech.id} className={`group-card ${tech.isUnlocked ? 'unlocked' : 'locked'}`}>
                <div className="group-card-head">
                  <div>
                    <p className="group-card-eyebrow">{tech.totalCount} 件の加盟店</p>
                    <h3>{tech.name}</h3>
                  </div>
                  <div className="group-card-amount">
                    <span>基本支援</span>
                    <strong>{tech.baseAmount.toLocaleString()} G</strong>
                  </div>
                </div>
                <p className="group-card-description">{tech.description}</p>

                <div className="group-progress">
                  <div className="group-progress-track">
                    <div className="group-progress-fill" style={{ width: `${tech.progressPercent}%` }} />
                  </div>
                  <span>{tech.ownedCount} / {tech.totalCount} 所有（{tech.progressPercent}%）</span>
                </div>

                <div className="group-members">
                  {visibleMembers.map(member => (
                    <span
                      key={member.id}
                      className={`member-chip ${member.ownedByPlayer ? 'owned' : ''} ${member.rivalOwned ? 'rival' : ''}`.trim()}
                      title={`${member.cityName} / ${member.name}`}
                    >
                      {member.name}
                    </span>
                  ))}
                  {remainingMembers > 0 && (
                    <span className="member-chip ghost">+{remainingMembers}</span>
                  )}
                </div>

                <div className="group-card-footer">
                  {tech.isUnlocked ? (
                    <button
                      className="group-action-btn"
                      onClick={() => handleRequestFunds(tech)}
                      disabled={tech.ownedCount === 0}
                    >
                      💰 資金を要求
                    </button>
                  ) : (
                    <p className="unlock-hint">
                      {tech.ownedCount === 0
                        ? '関連物件を買収して連携の糸口を探りましょう'
                        : `あと${remainingProperties}件で閃きのチャンス`}
                    </p>
                  )}
                  <span className={`group-status ${tech.isUnlocked ? 'unlocked' : 'locked'}`}>
                    {tech.isUnlocked ? '✓ 習得済み' : '🔒 未習得'}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
