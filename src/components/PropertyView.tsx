// 物件ビュー - 物件一覧と買収画面
import type { GameState, Property } from '../types/game';
import { cities } from '../data/cities';
import { useMemo, useState } from 'react';
import { 
  getIndependenceRiskColor, 
  getIndependenceRiskLabel, 
  calculateDailyIncome,
  canAcquireProperty,
  checkGroupTechniqueUnlock,
} from '../data/gameState';
import { AcquisitionBattleComponent } from './AcquisitionBattle';
import { useNotifications } from '../context/NotificationContext';

const categoryIcons: Record<string, string> = {
  '牧場': '🐑',
  '織': '🧵',
  '工房': '⚙️',
  '製紙': '📜',
  '海運': '⚓',
  '商会': '🏦',
  '酒場': '🍷',
  'カフェ': '☕',
  'コーヒー': '☕',
  '鍛冶': '⚒️',
  '農': '🌾',
  '劇場': '🎭',
  '温泉': '♨️',
};

const cityThemes: Record<string, { accent: string; glow: string }> = {
  vanguard: { accent: '#f39c12', glow: 'rgba(243, 156, 18, 0.35)' },
  yamas: { accent: '#2ecc71', glow: 'rgba(46, 204, 113, 0.3)' },
  wilmington: { accent: '#3498db', glow: 'rgba(52, 152, 219, 0.35)' },
  pidona: { accent: '#9b59b6', glow: 'rgba(155, 89, 182, 0.35)' },
  lance: { accent: '#e74c3c', glow: 'rgba(231, 76, 60, 0.35)' },
  greatarc: { accent: '#e67e22', glow: 'rgba(230, 126, 34, 0.35)' },
  roarne: { accent: '#d35400', glow: 'rgba(211, 84, 0, 0.35)' },
  zweig: { accent: '#16a085', glow: 'rgba(22, 160, 133, 0.35)' },
};

const getCategoryIcon = (category: string) => {
  const matched = Object.entries(categoryIcons).find(([key]) => category.includes(key));
  return matched ? matched[1] : '🏢';
};

const getCityTheme = (cityId: string) => cityThemes[cityId] ?? { accent: '#c8b6a6', glow: 'rgba(200, 182, 166, 0.35)' };

interface PropertyViewProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

export const PropertyView = ({ gameState, setGameState }: PropertyViewProps) => {
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [currentBattle, setCurrentBattle] = useState<Property | null>(null);
  const { notify } = useNotifications();

  const ownedProperties = useMemo(
    () => gameState.properties.filter(p => p.ownerId === 'player'),
    [gameState.properties]
  );
  const dailyIncome = calculateDailyIncome(gameState.player.ownedProperties, gameState.properties);

  const filteredProperties = useMemo(() => {
    return gameState.properties.filter(property => {
      if (selectedCity !== 'all' && property.cityId !== selectedCity) return false;
      if (selectedGroup !== 'all' && property.group !== selectedGroup) return false;
      return true;
    });
  }, [gameState.properties, selectedCity, selectedGroup]);

  const allGroups = useMemo(
    () => [...new Set(gameState.properties.map(p => p.group))],
    [gameState.properties]
  );
  
  // 物件買収開始
  const startAcquisition = (propertyId: string) => {
    const result = canAcquireProperty(propertyId, gameState.player.capital, gameState.properties);
    
    if (!result.canAcquire) {
      notify('warning', result.reason || '買収できません');
      return;
    }
    
    // 買収劇を起動
    const property = gameState.properties.find(p => p.id === propertyId);
    if (property) {
      setCurrentBattle(property);
    }
    else {
      notify('error', '物件が見つかりません');
    }
  };

  // 買収劇完了
  const handleBattleComplete = (success: boolean) => {
    if (!currentBattle) return;

    if (success) {
      // 買収成功
      const property = gameState.properties.find(p => p.id === currentBattle.id);
      if (property) {
        const updatedOwnedProperties = [...gameState.player.ownedProperties, property.id];
        const newlyUnlockedIds = checkGroupTechniqueUnlock(property.id, updatedOwnedProperties, gameState.groupTechniques);
        const updatedGroupTechniques = newlyUnlockedIds.length > 0
          ? gameState.groupTechniques.map(tech =>
              newlyUnlockedIds.includes(tech.id) ? { ...tech, isUnlocked: true } : tech
            )
          : gameState.groupTechniques;

        setGameState({
          ...gameState,
          player: {
            ...gameState.player,
            capital: gameState.player.capital - property.basePrice,
            ownedProperties: updatedOwnedProperties,
            unlockedGroupTechniques: newlyUnlockedIds.length > 0
              ? Array.from(new Set([...gameState.player.unlockedGroupTechniques, ...newlyUnlockedIds]))
              : gameState.player.unlockedGroupTechniques,
          },
          properties: gameState.properties.map(p =>
            p.id === property.id ? { ...p, ownerId: 'player' } : p
          ),
          groupTechniques: updatedGroupTechniques,
        });

        notify('success', `${property.name} の買収に成功しました！`);
        newlyUnlockedIds.forEach(id => {
          const unlockedTech = gameState.groupTechniques.find(tech => tech.id === id);
          if (unlockedTech) {
            notify('info', `${unlockedTech.name} のグループ技を習得しました！`);
          }
        });
      }
    } else {
      notify('error', '買収に失敗しました...');
    }

    setCurrentBattle(null);
  };

  // 買収劇キャンセル
  const handleBattleCancel = () => {
    setCurrentBattle(null);
    notify('info', '買収劇を中断しました');
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
    notify('success', `${income.toLocaleString()} G の収益を得ました！`);
  };

  // 物件カードの描画
  const renderPropertyCard = (property: Property) => {
    const city = cities.find(c => c.id === property.cityId);
    const isOwned = property.ownerId === 'player';
    const isOwnedByOther = property.ownerId !== null && property.ownerId !== 'player';
    const riskColor = getIndependenceRiskColor(property.independenceRisk);
    const riskLabel = getIndependenceRiskLabel(property.independenceRisk);
    const theme = getCityTheme(property.cityId);
    const categoryIcon = getCategoryIcon(property.category);
    const riskPercent = Math.min(100, (property.independenceRisk / 128) * 100);
    
    return (
      <div 
        key={property.id} 
        className={`property-card ${isOwned ? 'owned' : ''} ${isOwnedByOther ? 'competitor' : ''}`}
        style={{ borderColor: theme.accent, boxShadow: `0 25px 35px -25px ${theme.glow}` }}
      >
        <div className="card-highlight" style={{ background: theme.glow }} aria-hidden />
        <div className="card-header">
          <div>
            <span className="city-chip" style={{ borderColor: theme.accent }}>{city?.name}</span>
            <h3>{property.name}</h3>
          </div>
          <span className="category-icon" aria-hidden>{categoryIcon}</span>
        </div>
        <p className="category-label">{property.category}</p>
        <p className="group-chip">グループ: {property.group}</p>
        <p className="description">{property.description}</p>
        
        <div className="property-stats-grid">
          <div className="stat">
            <span>相場価格</span>
            <strong>{property.basePrice.toLocaleString()} G</strong>
          </div>
          <div className="stat">
            <span>日々の収入</span>
            <strong>+{property.income.toLocaleString()} G</strong>
          </div>
        </div>

        <div className="risk-meter">
          <div className="risk-label">
            <span>独立危険度</span>
            <strong style={{ color: riskColor }}>{riskLabel}</strong>
          </div>
          <div className="risk-track">
            <div className="risk-fill" style={{ width: `${riskPercent}%`, backgroundColor: riskColor }} />
          </div>
        </div>

        <div className="card-actions">
          {!isOwned ? (
            <button 
              className="acquire-btn"
              onClick={() => startAcquisition(property.id)}
            >
              買収する{isOwnedByOther ? '（他社所有）' : ''}
            </button>
          ) : (
            <button className="acquire-btn" disabled>
              所有中
            </button>
          )}
        </div>

        {isOwned && (
          <span className="status-chip owned">✓ 所有中</span>
        )}
        
        {isOwnedByOther && (
          <span className="status-chip rival">他社所有</span>
        )}
      </div>
    );
  };
  
  return (
    <div className="property-view">
      <div className="property-summary">
        <div>
          <h2>🏢 物件管理</h2>
          <p>物件を買収して資産を増やしましょう</p>
        </div>
        <div className="summary-stats">
          <div className="stat-box">
            <span>所有物件</span>
            <strong>{ownedProperties.length} / {gameState.properties.length}</strong>
          </div>
          <div className="stat-box">
            <span>日々の収入</span>
            <strong>{dailyIncome.toLocaleString()} G</strong>
          </div>
          <div className="stat-box">
            <span>総資産価値</span>
            <strong>
              {ownedProperties.reduce((sum, p) => sum + p.basePrice, 0).toLocaleString()} G
            </strong>
          </div>
        </div>
        {ownedProperties.length > 0 && (
          <button onClick={advanceDay} className="advance-day-btn">
            📅 日を進める（収益回収）
          </button>
        )}
      </div>
      
      <div className="filter-bar">
        <div className="filter-group">
          <label>都市で絞り込み</label>
          <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
            <option value="all">すべて</option>
            {cities.map(city => (
              <option key={city.id} value={city.id}>{city.name}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>グループ</label>
          <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
            <option value="all">すべて</option>
            {allGroups.sort().map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>
        <button className="ghost-btn" onClick={() => { setSelectedCity('all'); setSelectedGroup('all'); }}>
          フィルターをクリア
        </button>
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
