import { useMemo, useState } from 'react';
import type { GameState, NegotiationTechnique } from '../types/game';
import { useNotifications } from '../context/NotificationContext';

interface NegotiationTechniqueViewProps {
  gameState: GameState;
}

type StatusFilter = 'all' | 'unlocked' | 'locked';

type EffectCategory = 'all' | string;

interface DecoratedTechnique extends NegotiationTechnique {
  effectLabel: string;
  effectDescription: string;
  badgeShade: string;
}

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: 'すべて', value: 'all' },
  { label: '習得済み', value: 'unlocked' },
  { label: '未習得', value: 'locked' },
];

const effectDictionary: Record<string, { label: string; description: string; badgeShade: string }> = {
  accel_increase: { label: '加速度アップ', description: '自社ゲージ加速度を上げる', badgeShade: '#52ffa8' },
  opponent_accel_decrease: { label: '敵加速度ダウン', description: '敵社ゲージ加速度を下げる', badgeShade: '#ff6b6b' },
  speed_increase: { label: '速度操作', description: 'ゲージ移動速度へ影響', badgeShade: '#f0b400' },
  speed_increase_next_day: { label: '翌日速度', description: '翌日に速度へボーナス', badgeShade: '#6dd3ff' },
  command_time_half: { label: '指示短縮', description: '自社コマンド待ち短縮', badgeShade: '#ffd966' },
  opponent_time_double: { label: '敵時間延長', description: '敵社コマンドを遅くする', badgeShade: '#ff9a8d' },
  reset_time: { label: '再調整', description: '待ち時間を初期化', badgeShade: '#c999ff' },
  gauge_random: { label: '乱れゲージ', description: 'ゲージを大きく揺さぶる', badgeShade: '#ffa6e3' },
  random_persuade: { label: '説得チャンス', description: '確率で一気に有利に', badgeShade: '#9ce8ff' },
  price_double: { label: '相場上昇', description: '相場が倍に', badgeShade: '#ffa94d' },
  price_half: { label: '相場半減', description: '相場が半分に', badgeShade: '#f18fff' },
  opponent_risk_increase: { label: '敵危険度上昇', description: '敵物件の危険度を増す', badgeShade: '#ffb347' },
  risk_half: { label: '危険度半減', description: '独立危険度を抑える', badgeShade: '#6decb9' },
  accel_increase_default: { label: '交渉術', description: 'ゲージ操作に影響', badgeShade: '#d1c6b4' },
};

const getEffectMeta = (effectKey: string) => {
  return effectDictionary[effectKey] ?? effectDictionary.accel_increase_default;
};

export const NegotiationTechniqueView = ({ gameState }: NegotiationTechniqueViewProps) => {
  const { notify } = useNotifications();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [effectFilter, setEffectFilter] = useState<EffectCategory>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [preparedTechniqueId, setPreparedTechniqueId] = useState<string | null>(null);

  const decoratedTechniques = useMemo<DecoratedTechnique[]>(() => {
    return gameState.negotiationTechniques.map(tech => {
      const meta = getEffectMeta(tech.effect);
      return {
        ...tech,
        effectLabel: meta.label,
        effectDescription: meta.description,
        badgeShade: meta.badgeShade,
      };
    });
  }, [gameState.negotiationTechniques]);

  const unlockedCount = decoratedTechniques.filter(tech => tech.isUnlocked).length;
  const lockedCount = decoratedTechniques.length - unlockedCount;
  const preparedTechnique = decoratedTechniques.find(tech => tech.id === preparedTechniqueId) ?? null;

  const nextUnlockCandidate = useMemo(() => {
    return decoratedTechniques
      .filter(tech => !tech.isUnlocked)
      .sort((a, b) => a.cost - b.cost)[0];
  }, [decoratedTechniques]);

  const mostPotentTechnique = useMemo(() => {
    return decoratedTechniques
      .filter(tech => tech.isUnlocked)
      .sort((a, b) => b.effectValue - a.effectValue)[0];
  }, [decoratedTechniques]);

  const effectOptions = useMemo(() => {
    const uniqueEffects = Array.from(new Set(decoratedTechniques.map(tech => tech.effect)));
    return uniqueEffects.map(effect => ({
      value: effect,
      label: getEffectMeta(effect).label,
    }));
  }, [decoratedTechniques]);

  const filteredTechniques = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return decoratedTechniques
      .filter(tech => {
        if (statusFilter === 'locked' && tech.isUnlocked) return false;
        if (statusFilter === 'unlocked' && !tech.isUnlocked) return false;
        if (effectFilter !== 'all' && tech.effect !== effectFilter) return false;
        if (term) {
          const haystack = `${tech.name}${tech.description}${tech.effectLabel}`.toLowerCase();
          if (!haystack.includes(term)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.isUnlocked !== b.isUnlocked) {
          return a.isUnlocked ? -1 : 1;
        }
        if (a.effect === effectFilter && b.effect !== effectFilter) return -1;
        if (b.effect === effectFilter && a.effect !== effectFilter) return 1;
        return b.effectValue - a.effectValue;
      });
  }, [decoratedTechniques, statusFilter, effectFilter, searchTerm]);

  const handlePrepareTechnique = (tech: DecoratedTechnique) => {
    if (!tech.isUnlocked) {
      notify('info', `${tech.name} はまだ習得できていません`);
      return;
    }

    setPreparedTechniqueId(prev => (prev === tech.id ? null : tech.id));
    if (preparedTechniqueId === tech.id) {
      notify('info', `${tech.name} を作戦ボードから外しました`);
    } else {
      notify('success', `${tech.name} を次の買収劇に備えて温存しました`);
    }
  };

  const handleShowUnlockHint = (tech: DecoratedTechnique) => {
    notify('warning', `${tech.name}: ${tech.unlockCondition}`);
  };

  return (
    <section className="techniques-view">
      <header className="tech-summary">
        <div>
          <h2>💡 かけひき技</h2>
          <p>フルブライト流の交渉術で買収劇を有利に進めましょう</p>
        </div>
        <div className="tech-stat-grid">
          <article className="tech-stat-card">
            <span>習得済み</span>
            <strong>{unlockedCount} / {decoratedTechniques.length}</strong>
          </article>
          <article className="tech-stat-card">
            <span>未習得</span>
            <strong>{lockedCount}</strong>
          </article>
          <article className="tech-stat-card">
            <span>準備中の技</span>
            <strong>{preparedTechnique ? preparedTechnique.name : '未選択'}</strong>
            {preparedTechnique && <p>コスト: {preparedTechnique.cost.toLocaleString()} G</p>}
          </article>
          <article className="tech-stat-card accent">
            <span>次に狙うべき</span>
            <strong>{nextUnlockCandidate ? nextUnlockCandidate.name : 'すべて習得済み'}</strong>
            {nextUnlockCandidate && <p>必要資金目安 {nextUnlockCandidate.cost.toLocaleString()} G</p>}
          </article>
          {mostPotentTechnique && (
            <article className="tech-stat-card highlight">
              <span>最強の一手</span>
              <strong>{mostPotentTechnique.name}</strong>
              <p>{mostPotentTechnique.effectLabel} / 効果値 {mostPotentTechnique.effectValue}</p>
            </article>
          )}
        </div>
      </header>

      <div className="tech-controls">
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
        <select
          className="effect-select"
          value={effectFilter}
          onChange={(event) => setEffectFilter(event.target.value as EffectCategory)}
        >
          <option value="all">すべての効果</option>
          {effectOptions.map(effect => (
            <option key={effect.value} value={effect.value}>{effect.label}</option>
          ))}
        </select>
        <input
          type="search"
          placeholder="技名や効果で検索"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      {filteredTechniques.length === 0 ? (
        <p className="empty-state">該当するかけひき技がありません</p>
      ) : (
        <div className="tech-card-grid">
          {filteredTechniques.map(tech => (
            <article key={tech.id} className={`tech-card ${tech.isUnlocked ? 'unlocked' : 'locked'}`}>
              <div className="tech-card-head">
                <div>
                  <p className="tech-eyebrow">効果値 {tech.effectValue}</p>
                  <h3>{tech.name}</h3>
                </div>
                <div className="tech-cost">
                  <span>コスト</span>
                  <strong>{tech.cost.toLocaleString()} G</strong>
                </div>
              </div>

              <div className="effect-chip" style={{ borderColor: tech.badgeShade, color: tech.badgeShade }}>
                {tech.effectLabel}
              </div>
              <p className="tech-description">{tech.description}</p>

              <dl className="tech-meta">
                <div>
                  <dt>効果詳細</dt>
                  <dd>{tech.effectDescription}</dd>
                </div>
                <div>
                  <dt>習得条件</dt>
                  <dd>{tech.unlockCondition}</dd>
                </div>
              </dl>

              <div className="tech-card-footer">
                {tech.isUnlocked ? (
                  <button
                    className={`tech-action-btn ${preparedTechniqueId === tech.id ? 'active' : ''}`}
                    onClick={() => handlePrepareTechnique(tech)}
                  >
                    {preparedTechniqueId === tech.id ? '準備解除' : '作戦にセット'}
                  </button>
                ) : (
                  <button className="tech-action-btn ghost" onClick={() => handleShowUnlockHint(tech)}>
                    条件を確認
                  </button>
                )}
                <span className={`tech-status ${tech.isUnlocked ? 'unlocked' : 'locked'}`}>
                  {tech.isUnlocked ? '✓ 習得済み' : '🔒 未習得'}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
