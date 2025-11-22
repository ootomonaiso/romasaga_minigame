// トレード交渉 - ストライプゲージによる交渉ミニゲーム
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { AcquisitionBattle, Property, GameState } from '../types/game';
import {
  calculatePropertyFunding,
  calculateGroupFunding,
  getIndependenceRiskColor,
  getIndependenceRiskLabel,
} from '../data/gameState';
import { cities } from '../data/cities';

type TradePhase = 'entry' | 'funding' | 'negotiation' | 'decision';

interface TradeLogEntry {
  id: string;
  message: string;
  tone: 'player' | 'opponent';
  timestamp: string;
}

const tradePhaseSteps: Array<{ key: TradePhase; label: string; hint: string }> = [
  { key: 'entry', label: '状況確認', hint: 'ターゲットの把握' },
  { key: 'funding', label: '資金調達', hint: '出資元を確保' },
  { key: 'negotiation', label: '交渉', hint: '技で主導権を奪う' },
  { key: 'decision', label: '決着', hint: '勝負の瞬間' },
];

interface AcquisitionBattleProps {
  property: Property;
  gameState: GameState;
  onComplete: (success: boolean) => void;
  onCancel: () => void;
}

export const AcquisitionBattleComponent = ({ 
  property, 
  gameState, 
  onComplete,
  onCancel 
}: AcquisitionBattleProps) => {
  const [battle, setBattle] = useState<AcquisitionBattle>({
    propertyId: property.id,
    opponentCompany: property.ownerId || 'ライバル商会',
    opponentCapital: property.basePrice * 1.5,
    gaugeValue: 32768,
    gaugeSpeed: 0,
    playerAcceleration: 10,
    opponentAcceleration: 8,
    playerCommandWaitTime: 100,
    opponentCommandWaitTime: 120,
    battleDay: 1,
    isPlayerTurn: true,
  });

  const [playerFunds, setPlayerFunds] = useState(0);
  const [opponentFunds, setOpponentFunds] = useState(0);
  const [message, setMessage] = useState('トレードを開始します！');
  const [isAnimating, setIsAnimating] = useState(false);
  const [battleResult, setBattleResult] = useState<'victory' | 'defeat' | null>(null);
  const [phase, setPhase] = useState<TradePhase>('entry');
  const [actionLog, setActionLog] = useState<TradeLogEntry[]>(() => {
    const timestamp = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    return [
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        tone: 'player',
        message: `${property.name} のトレードを開始しました`,
        timestamp,
      },
    ];
  });

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) => {
        const seeded = Math.sin(index * 17 + 1) * 10000;
        const fractional = seeded - Math.floor(seeded);
        return {
          delay: `${index * 40}ms`,
          left: `${Math.round(fractional * 100)}%`,
        };
      }),
    []
  );

  const city = useMemo(() => cities.find(c => c.id === property.cityId), [property.cityId]);
  const riskColor = useMemo(() => getIndependenceRiskColor(property.independenceRisk), [property.independenceRisk]);
  const riskLabel = useMemo(() => getIndependenceRiskLabel(property.independenceRisk), [property.independenceRisk]);
  const gaugePercentage = (battle.gaugeValue / 65535) * 100;
  const phaseIndex = tradePhaseSteps.findIndex(step => step.key === phase);

  const addLogEntry = useCallback((tone: 'player' | 'opponent', entryMessage: string) => {
    const timestamp = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    setActionLog(prev => {
      const next = [
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
          tone,
          message: entryMessage,
          timestamp,
        },
        ...prev,
      ];
      return next.slice(0, 5);
    });
  }, []);

  const updateStatus = useCallback((text: string, tone: 'player' | 'opponent' = 'player') => {
    setMessage(text);
    addLogEntry(tone, text);
  }, [addLogEntry]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBattle(prev => {
        const newGaugeValue = prev.gaugeValue + prev.gaugeSpeed;

        if (newGaugeValue <= 0) {
          clearInterval(interval);
          setBattleResult('defeat');
          setPhase('decision');
          updateStatus('トレード失敗...', 'opponent');
          setTimeout(() => onComplete(false), 900);
          return prev;
        }
        if (newGaugeValue >= 65535) {
          clearInterval(interval);
          setBattleResult('victory');
          setPhase('decision');
          updateStatus('トレード成立！');
          setTimeout(() => onComplete(true), 900);
          return prev;
        }

        let newSpeed = prev.gaugeSpeed;
        if (playerFunds > opponentFunds) {
          newSpeed += prev.playerAcceleration / 10;
        } else if (opponentFunds > playerFunds) {
          newSpeed -= prev.opponentAcceleration / 10;
        }

        return {
          ...prev,
          gaugeValue: newGaugeValue,
          gaugeSpeed: newSpeed,
        };
      });
    }, 50);

    return () => clearInterval(interval);
  }, [playerFunds, opponentFunds, onComplete, updateStatus]);

  const passTurnToOpponent = () => {
    setBattle(prev => ({ ...prev, isPlayerTurn: false }));
  };

  const requestFunds = () => {
    if (isAnimating || !battle.isPlayerTurn) return;
    setIsAnimating(true);

    const ownedProps = gameState.properties.filter(p => p.ownerId === 'player');
    if (ownedProps.length === 0) {
      updateStatus('所有している物件がありません！');
      setIsAnimating(false);
      return;
    }

    const randomProp = ownedProps[Math.floor(Math.random() * ownedProps.length)];
    const funds = calculatePropertyFunding(randomProp.id, gameState.properties);
    setPlayerFunds(prev => prev + funds);
    updateStatus(`${randomProp.name} から ${funds.toLocaleString()} G を調達！`);
    setPhase('funding');
    passTurnToOpponent();

    setTimeout(() => {
      setMessage('物件の独立危険度が少し上昇...');
      setIsAnimating(false);
    }, 1000);
  };

  const requestGroupFunds = () => {
    if (isAnimating || !battle.isPlayerTurn) return;
    setIsAnimating(true);

    const unlockedGroups = gameState.groupTechniques.filter(g => g.isUnlocked);
    if (unlockedGroups.length === 0) {
      updateStatus('習得しているグループ技がありません！');
      setIsAnimating(false);
      return;
    }

    const randomGroup = unlockedGroups[Math.floor(Math.random() * unlockedGroups.length)];
    const funds = calculateGroupFunding(
      randomGroup.id,
      gameState.groupTechniques,
      gameState.player.ownedProperties
    );

    setPlayerFunds(prev => prev + funds);
    updateStatus(`${randomGroup.name} から ${funds.toLocaleString()} G を獲得！（グループ）`);
    setPhase('funding');
    passTurnToOpponent();

    setTimeout(() => setIsAnimating(false), 1000);
  };

  const useNegotiation = () => {
    if (isAnimating || !battle.isPlayerTurn) return;
    setIsAnimating(true);

    const unlockedTechs = gameState.negotiationTechniques.filter(t => t.isUnlocked);
    if (unlockedTechs.length === 0) {
      updateStatus('習得しているかけひき技がありません！');
      setIsAnimating(false);
      return;
    }

    const smileTech = unlockedTechs.find(t => t.id === 'smile');
    if (smileTech) {
      setBattle(prev => ({
        ...prev,
        playerAcceleration: prev.playerAcceleration + 1,
      }));
      updateStatus('スマイルで会場が和み、加速度 +1');
    } else {
      updateStatus('かけひき技で揺さぶりを仕掛けた');
    }

    setPhase('negotiation');
    passTurnToOpponent();
    setTimeout(() => setIsAnimating(false), 1000);
  };

  const useOwnFunds = () => {
    if (isAnimating || !battle.isPlayerTurn) return;
    setIsAnimating(true);

    const amount = Math.min(gameState.player.capital, property.basePrice * 0.1);
    if (amount < 1000) {
      updateStatus('投入できる資金が不足しています！');
      setIsAnimating(false);
      return;
    }

    setPlayerFunds(prev => prev + amount);
    updateStatus(`自社資金 ${amount.toLocaleString()} G を追加投入！`);
    setPhase('funding');
    passTurnToOpponent();

    setTimeout(() => setIsAnimating(false), 1000);
  };

  const giveUp = () => {
    if (confirm('トレードを終了しますか？')) {
      setPhase('decision');
      updateStatus('トレードから撤退しました');
      onCancel();
    }
  };

  useEffect(() => {
    if (!battle.isPlayerTurn && !isAnimating) {
      const timer = setTimeout(() => {
        const opponentMove = Math.random();
        let funds = 0;
        let moveMessage = '';

        if (opponentMove < 0.5) {
          funds = Math.floor(property.basePrice * 0.05 * (1 + Math.random()));
          moveMessage = `相手が資金を投入！ ${funds.toLocaleString()} G`;
          setOpponentFunds(prev => prev + funds);
        } else {
          setBattle(prev => ({
            ...prev,
            opponentAcceleration: prev.opponentAcceleration + 1,
          }));
          moveMessage = '相手が戦術を使用し、加速度が上昇';
        }

        updateStatus(moveMessage, 'opponent');
        setPhase('negotiation');
        setBattle(prev => ({ ...prev, isPlayerTurn: true }));
      }, 900);

      return () => clearTimeout(timer);
    }
  }, [battle.isPlayerTurn, isAnimating, property.basePrice, updateStatus]);

  const locationLabel = city?.name ?? '未知の都市';

  return (
    <div className="acquisition-battle-overlay">
      <div className="acquisition-battle battle-enter">
        {battleResult && (
          <div className={`battle-result ${battleResult}`}>
            <p>{battleResult === 'victory' ? 'トレード成立！' : 'トレード失敗...'}</p>
            <div className="confetti-spray">
              {confettiPieces.map((piece, index) => (
                <span
                  key={index}
                  style={{ animationDelay: piece.delay, left: piece.left }}
                />
              ))}
            </div>
          </div>
        )}

        <header className="trade-header">
          <div className="trade-breadcrumb">
            <span>トレード</span>
            <span className="crumb-divider">›</span>
            <span>{locationLabel}</span>
            <span className="crumb-divider">›</span>
            <strong>{property.name}</strong>
          </div>
          <button className="close-btn" onClick={onCancel}>街へ戻る</button>
        </header>

        <div className="trade-meta-grid">
          <div className="trade-location-card">
            <p className="trade-location-eyebrow">現在の遠征先</p>
            <h3>{locationLabel}</h3>
            <p className="trade-location-desc">{city?.description ?? 'この都市の事情を探りましょう'}</p>
            <div className="trade-tags">
              <span className="trade-tag">{property.category}</span>
              <span className="trade-tag">{property.group}</span>
              <span className="trade-tag accent">日収 +{property.income.toLocaleString()} G</span>
            </div>
          </div>
          <div className="trade-phase-track">
            {tradePhaseSteps.map((step, index) => {
              const status = index < phaseIndex ? 'completed' : index === phaseIndex ? 'current' : 'upcoming';
              return (
                <div key={step.key} className={`trade-phase-step ${status}`}>
                  <span>{step.label}</span>
                  <small>{step.hint}</small>
                </div>
              );
            })}
          </div>
        </div>

        <div className="trade-grid">
          <section className="trade-brief">
            <div className="trade-property-card">
              <div className="trade-property-head">
                <h3>{property.name}</h3>
                <span className="trade-day-chip">DAY {battle.battleDay}</span>
              </div>
              <p className="trade-property-desc">{property.description}</p>
              <ul className="trade-property-meta">
                <li><span>相場</span><strong>{property.basePrice.toLocaleString()} G</strong></li>
                <li><span>独立危険度</span><strong style={{ color: riskColor }}>{riskLabel}</strong></li>
                <li><span>所有状況</span><strong>{property.ownerId ? '他社所有' : '未所有'}</strong></li>
                <li><span>収益</span><strong>+{property.income.toLocaleString()} G / 日</strong></li>
              </ul>
            </div>

            <div className="trade-log-panel">
              <div className="trade-log-head">
                <h4>行動ログ</h4>
              </div>
              {actionLog.length === 0 ? (
                <p className="trade-log-empty">まだログがありません</p>
              ) : (
                <ul className="trade-log">
                  {actionLog.map(entry => (
                    <li key={entry.id} className={entry.tone}>
                      <span className="log-time">{entry.timestamp}</span>
                      <p>{entry.message}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="trade-engagement">
            <div className="battle-info">
              <div className="info-row">
                <div className="player-info">
                  <h3>自社</h3>
                  <p>投入資金: {playerFunds.toLocaleString()} G</p>
                  <p>加速度: {battle.playerAcceleration}</p>
                </div>
                <div className="vs">VS</div>
                <div className="opponent-info">
                  <h3>{battle.opponentCompany}</h3>
                  <p>投入資金: {opponentFunds.toLocaleString()} G</p>
                  <p>加速度: {battle.opponentAcceleration}</p>
                </div>
              </div>
            </div>

            <div className="gauge-container">
              <div className="gauge-labels">
                <span className="gauge-label-left">敵社有利</span>
                <span className="gauge-label-center">均衡</span>
                <span className="gauge-label-right">自社有利</span>
              </div>
              <div className="stripe-gauge">
                <div className="gauge-fill player-side" style={{ width: `${gaugePercentage}%` }} />
                <div className="gauge-fill opponent-side" style={{ width: `${100 - gaugePercentage}%` }} />
                <div className="gauge-indicator" style={{ left: `${gaugePercentage}%` }}>▼</div>
              </div>
              <div className="gauge-percentage">
                <span className="opponent-percent">{(100 - gaugePercentage).toFixed(1)}%</span>
                <span className="player-percent">{gaugePercentage.toFixed(1)}%</span>
              </div>
            </div>

            <div className="trade-status-card">
              <p>{message}</p>
            </div>

            <div className="command-buttons">
              <button 
                className="command-btn"
                onClick={requestFunds}
                disabled={isAnimating || !battle.isPlayerTurn}
              >
                💰 資金を要求する
              </button>
              <button 
                className="command-btn"
                onClick={requestGroupFunds}
                disabled={isAnimating || !battle.isPlayerTurn}
              >
                🔗 グループに要求
              </button>
              <button 
                className="command-btn"
                onClick={useNegotiation}
                disabled={isAnimating || !battle.isPlayerTurn}
              >
                💡 かけひきする
              </button>
              <button 
                className="command-btn"
                onClick={useOwnFunds}
                disabled={isAnimating || !battle.isPlayerTurn}
              >
                💵 自社資金を出す
              </button>
              <button 
                className="command-btn danger"
                onClick={giveUp}
                disabled={isAnimating}
              >
                🚪 トレードをやめる
              </button>
            </div>

            <div className="battle-help">
              <p>💡 ヒント: グループ資金と交渉術を組み合わせて、ゲージを自社側に寄せましょう。</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
