// 買収劇 - ストライプゲージによる交渉ミニゲーム
import { useState, useEffect } from 'react';
import type { AcquisitionBattle, Property, GameState } from '../types/game';
import { calculatePropertyFunding, calculateGroupFunding } from '../data/gameState';

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
    gaugeValue: 32768, // 中央からスタート（0-65535）
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
  const [message, setMessage] = useState('買収劇が始まります！');
  const [isAnimating, setIsAnimating] = useState(false);

  // ゲージの割合を計算（0-100%）
  const gaugePercentage = (battle.gaugeValue / 65535) * 100;

  // ゲージの自動更新
  useEffect(() => {
    const interval = setInterval(() => {
      setBattle(prev => {
        const newGaugeValue = prev.gaugeValue + prev.gaugeSpeed;
        
        // ゲージの上下限チェック
        if (newGaugeValue <= 0) {
          clearInterval(interval);
          setTimeout(() => onComplete(false), 500);
          return prev;
        }
        if (newGaugeValue >= 65535) {
          clearInterval(interval);
          setTimeout(() => onComplete(true), 500);
          return prev;
        }

        // 加速度を適用
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
    }, 50); // 50msごとに更新

    return () => clearInterval(interval);
  }, [playerFunds, opponentFunds, onComplete]);

  // コマンド1: 資金を要求する
  const requestFunds = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    const ownedProps = gameState.properties.filter(p => p.ownerId === 'player');
    if (ownedProps.length === 0) {
      setMessage('所有している物件がありません！');
      setIsAnimating(false);
      return;
    }

    // ランダムな所有物件から資金を得る
    const randomProp = ownedProps[Math.floor(Math.random() * ownedProps.length)];
    const funds = calculatePropertyFunding(randomProp.id, gameState.properties);
    
    setPlayerFunds(prev => prev + funds);
    setMessage(`${randomProp.name}から ${funds.toLocaleString()} G を獲得！`);
    
    // 独立危険度が上昇（簡易版）
    setTimeout(() => {
      setMessage('物件の独立危険度が少し上昇...');
      setIsAnimating(false);
    }, 1000);
  };

  // コマンド2: グループに要求
  const requestGroupFunds = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    const unlockedGroups = gameState.groupTechniques.filter(g => g.isUnlocked);
    if (unlockedGroups.length === 0) {
      setMessage('習得しているグループ技がありません！');
      setIsAnimating(false);
      return;
    }

    // ランダムなグループ技を使用
    const randomGroup = unlockedGroups[Math.floor(Math.random() * unlockedGroups.length)];
    const funds = calculateGroupFunding(
      randomGroup.id,
      gameState.groupTechniques,
      gameState.player.ownedProperties,
      gameState.properties
    );
    
    setPlayerFunds(prev => prev + funds);
    setMessage(`${randomGroup.name}から ${funds.toLocaleString()} G を獲得！（グループ技）`);
    
    setTimeout(() => setIsAnimating(false), 1000);
  };

  // コマンド3: かけひきする
  const useNegotiation = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    const unlockedTechs = gameState.negotiationTechniques.filter(t => t.isUnlocked);
    if (unlockedTechs.length === 0) {
      setMessage('習得しているかけひき技がありません！');
      setIsAnimating(false);
      return;
    }

    // スマイルを使用（無料）
    const smileTech = unlockedTechs.find(t => t.id === 'smile');
    if (smileTech) {
      setBattle(prev => ({
        ...prev,
        playerAcceleration: prev.playerAcceleration + 1,
      }));
      setMessage('スマイルで相手に好感を与えた！ゲージ加速度+1');
    } else {
      setMessage('かけひき技を使用しました');
    }
    
    setTimeout(() => setIsAnimating(false), 1000);
  };

  // コマンド4: 自社資金を出す
  const useOwnFunds = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    const amount = Math.min(gameState.player.capital, property.basePrice * 0.1);
    if (amount < 1000) {
      setMessage('資金が不足しています！');
      setIsAnimating(false);
      return;
    }

    setPlayerFunds(prev => prev + amount);
    setMessage(`自社資金 ${amount.toLocaleString()} G を投入！`);
    
    setTimeout(() => setIsAnimating(false), 1000);
  };

  // コマンド5: 諦める
  const giveUp = () => {
    if (confirm('買収を諦めますか？')) {
      onCancel();
    }
  };

  // 相手のターン（自動）
  useEffect(() => {
    if (!battle.isPlayerTurn && !isAnimating) {
      const timer = setTimeout(() => {
        const opponentMove = Math.random();
        let funds = 0;
        let moveMessage = '';

        if (opponentMove < 0.5) {
          funds = Math.floor(property.basePrice * 0.05 * (1 + Math.random()));
          moveMessage = `相手が資金を投入！ ${funds.toLocaleString()} G`;
        } else {
          setBattle(prev => ({
            ...prev,
            opponentAcceleration: prev.opponentAcceleration + 1,
          }));
          moveMessage = '相手が戦術を使用！加速度が上がった';
        }

        setOpponentFunds(prev => prev + funds);
        setMessage(moveMessage);
        setBattle(prev => ({ ...prev, isPlayerTurn: true }));
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [battle.isPlayerTurn, isAnimating, property.basePrice]);

  return (
    <div className="acquisition-battle-overlay">
      <div className="acquisition-battle">
        <div className="battle-header">
          <h2>🎯 買収劇</h2>
          <p className="target-property">{property.name}（相場: {property.basePrice.toLocaleString()} G）</p>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

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

        {/* ストライプゲージ */}
        <div className="gauge-container">
          <div className="gauge-labels">
            <span className="gauge-label-left">敵社有利</span>
            <span className="gauge-label-center">均衡</span>
            <span className="gauge-label-right">自社有利</span>
          </div>
          <div className="stripe-gauge">
            <div 
              className="gauge-fill player-side"
              style={{ width: `${gaugePercentage}%` }}
            />
            <div 
              className="gauge-fill opponent-side"
              style={{ width: `${100 - gaugePercentage}%` }}
            />
            <div 
              className="gauge-indicator"
              style={{ left: `${gaugePercentage}%` }}
            >
              ▼
            </div>
          </div>
          <div className="gauge-percentage">
            <span className="opponent-percent">{(100 - gaugePercentage).toFixed(1)}%</span>
            <span className="player-percent">{gaugePercentage.toFixed(1)}%</span>
          </div>
        </div>

        {/* メッセージエリア */}
        <div className="battle-message">
          <p>{message}</p>
        </div>

        {/* コマンドボタン */}
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
            🚪 諦める
          </button>
        </div>

        <div className="battle-help">
          <p>💡 ヒント: グループ技を使うと大量の資金を獲得できます！</p>
        </div>
      </div>
    </div>
  );
};