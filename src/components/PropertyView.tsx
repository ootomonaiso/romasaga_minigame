// 物件ビュー - 物件一覧と買収画面
import type { GameState, Property } from '../types/game';
import { cities } from '../data/cities';
import { useState } from 'react';
import { 
  getIndependenceRiskColor, 
  getIndependenceRiskLabel, 
  calculateDailyIncome,
  canAcquireProperty 
} from '../data/gameState';
import { AcquisitionBattleComponent } from './AcquisitionBattle';

interface PropertyViewProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

export const PropertyView = ({ gameState, setGameState }: PropertyViewProps) => {
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [currentBattle, setCurrentBattle] = useState<Property | null>(null);
  
  // フィルター適用
  let filteredProperties = gameState.properties;
  
  if (selectedCity !== 'all') {
    filteredProperties = filteredProperties.filter(p => p.cityId === selectedCity);
  }
  
  if (selectedGroup !== 'all') {
    filteredProperties = filteredProperties.filter(p => p.group === selectedGroup);
  }
  
  // 所有物件の集計
  const ownedProperties = gameState.properties.filter(p => p.ownerId === 'player');
  const dailyIncome = calculateDailyIncome(gameState.player.ownedProperties, gameState.properties);
  
  // 全グループのリスト
  const allGroups = [...new Set(gameState.properties.map(p => p.group))];
  
  // 物件買収開始
  const startAcquisition = (propertyId: string) => {
    const result = canAcquireProperty(propertyId, gameState.player.capital, gameState.properties);
    
    if (!result.canAcquire) {
      alert(result.reason || '買収できません');
      return;
    }
    
    // 買収劇を起動
    const property = gameState.properties.find(p => p.id === propertyId);
    if (property) {
      setCurrentBattle(property);
    }
  };

  // 買収劇完了
  const handleBattleComplete = (success: boolean) => {
    if (!currentBattle) return;

    if (success) {
      // 買収成功
      const property = gameState.properties.find(p => p.id === currentBattle.id);
      if (property) {
        setGameState({
          ...gameState,
          player: {
            ...gameState.player,
            capital: gameState.player.capital - property.basePrice,
            ownedProperties: [...gameState.player.ownedProperties, property.id],
          },
          properties: gameState.properties.map(p =>
            p.id === property.id ? { ...p, ownerId: 'player' } : p
          ),
        });
        alert(`${property.name} の買収に成功しました！`);
      }
    } else {
      alert('買収に失敗しました...');
    }

    setCurrentBattle(null);
  };

  // 買収劇キャンセル
  const handleBattleCancel = () => {
    setCurrentBattle(null);
  };

  // 日を進める（収益回収）
  const advanceDay = () => {
    const income = calculateDailyIncome(gameState.player.ownedProperties, gameState.properties);
    setGameState({
      ...gameState,
      player: {
        ...gameState.player,
        capital: gameState.player.capital + income,
        currentDay: gameState.player.currentDay + 1,
      },
    });
    alert(`${income.toLocaleString()} G の収益を得ました！`);
  };

  // 物件カードの描画
  const renderPropertyCard = (property: Property) => {
    const city = cities.find(c => c.id === property.cityId);
    const isOwned = property.ownerId === 'player';
    const isOwnedByOther = property.ownerId !== null && property.ownerId !== 'player';
    const riskColor = getIndependenceRiskColor(property.independenceRisk);
    const riskLabel = getIndependenceRiskLabel(property.independenceRisk);
    
    return (
      <div 
        key={property.id} 
        className={`property-card ${isOwned ? 'owned' : ''} ${isOwnedByOther ? 'competitor' : ''}`}
        style={{
          borderLeft: isOwned ? `4px solid ${riskColor}` : undefined
        }}
      >
        <h3>{property.name}</h3>
        <p className="city-name">📍 {city?.name}</p>
        <p className="category">🏷️ {property.category}</p>
        <p className="group">🔗 グループ: {property.group}</p>
        
        <div className="property-stats">
          <div className="stat">
            <span className="label">相場価格</span>
            <span className="value">{property.basePrice.toLocaleString()} G</span>
          </div>
          <div className="stat">
            <span className="label">日々の収入</span>
            <span className="value">{property.income.toLocaleString()} G</span>
          </div>
          
          {isOwned && (
            <div className="stat">
              <span className="label">独立危険度</span>
              <span className="value" style={{ color: riskColor }}>
                {riskLabel} ({property.independenceRisk})
              </span>
            </div>
          )}
        </div>
        
        <p className="description">{property.description}</p>
        
        {!isOwned && !isOwnedByOther && (
          <button 
            className="acquire-btn"
            onClick={() => startAcquisition(property.id)}
          >
            買収する
          </button>
        )}
        
        {isOwned && (
          <div className="owned-badge">✓ 所有中</div>
        )}
        
        {isOwnedByOther && (
          <div className="competitor-badge">他社所有</div>
        )}
      </div>
    );
  };
  
  return (
    <div className="property-view">
      <div className="property-summary">
        <h2>🏢 物件管理</h2>
        <div className="summary-stats">
          <div className="stat-box">
            <div className="stat-label">所有物件</div>
            <div className="stat-value">{ownedProperties.length} / {gameState.properties.length}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">日々の収入</div>
            <div className="stat-value">{dailyIncome.toLocaleString()} G</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">総資産価値</div>
            <div className="stat-value">
              {ownedProperties.reduce((sum, p) => sum + p.basePrice, 0).toLocaleString()} G
            </div>
          </div>
        </div>
        
        {ownedProperties.length > 0 && (
          <button onClick={advanceDay} className="advance-day-btn">
            📅 日を進める（収益回収）
          </button>
        )}
      </div>
      
      <div className="property-filters">
        <div className="filter-group">
          <label>都市:</label>
          <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
            <option value="all">すべて</option>
            {cities.map(city => (
              <option key={city.id} value={city.id}>{city.name}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>グループ:</label>
          <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
            <option value="all">すべて</option>
            {allGroups.sort().map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="property-list">
        {filteredProperties.length > 0 ? (
          filteredProperties.map(property => renderPropertyCard(property))
        ) : (
          <p className="no-results">該当する物件がありません</p>
        )}
      </div>

      {/* 買収劇モーダル */}
      {currentBattle && (
        <AcquisitionBattleComponent
          property={currentBattle}
          gameState={gameState}
          onComplete={handleBattleComplete}
          onCancel={handleBattleCancel}
        />
      )}
    </div>
  );
};
