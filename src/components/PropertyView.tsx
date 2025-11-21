// 物件ビュー - 物件買収画面
import type { GameState } from '../types/game';
import { cities } from '../data/cities';
import { useState } from 'react';

interface PropertyViewProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

export const PropertyView = ({ gameState, setGameState }: PropertyViewProps) => {
  const [selectedCity, setSelectedCity] = useState('all');
  
  const filteredProperties = selectedCity === 'all'
    ? gameState.properties
    : gameState.properties.filter(p => p.cityId === selectedCity);
  
  const ownedProperties = gameState.properties.filter(p => 
    gameState.player.ownedProperties.includes(p.id)
  );
  
  const totalIncome = ownedProperties.reduce((sum, p) => sum + p.baseIncome, 0);
  
  const buyProperty = (propertyId: string) => {
    const property = gameState.properties.find(p => p.id === propertyId);
    if (!property) return;
    
    if (gameState.player.money < property.purchasePrice) {
      alert('資金が足りません！');
      return;
    }
    
    if (gameState.player.ownedProperties.includes(propertyId)) {
      alert('既に所有しています！');
      return;
    }
    
    setGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        money: prev.player.money - property.purchasePrice,
        ownedProperties: [...prev.player.ownedProperties, propertyId],
        reputation: prev.player.reputation + 5
      },
      properties: prev.properties.map(p =>
        p.id === propertyId ? { ...p, owned: true, ownedBy: 'player' } : p
      )
    }));
    
    alert(`${property.name}の買収に成功しました！`);
  };
  
  const collectIncome = () => {
    setGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        money: prev.player.money + totalIncome
      },
      turn: prev.turn + 1
    }));
    
    alert(`${totalIncome.toLocaleString()} オーラムの収益を得ました！`);
  };
  
  return (
    <div className="property-view">
      <div className="owned-summary">
        <h2>🏢 所有物件</h2>
        <p>所有数: {ownedProperties.length} / {gameState.properties.length}</p>
        <p>ターン収益: {totalIncome.toLocaleString()} オーラム</p>
        {ownedProperties.length > 0 && (
          <button onClick={collectIncome} className="collect-btn">
            収益を回収
          </button>
        )}
      </div>
      
      <div className="property-filter">
        <label>都市で絞り込み: </label>
        <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
          <option value="all">すべて</option>
          {cities.map(city => (
            <option key={city.id} value={city.id}>{city.name}</option>
          ))}
        </select>
      </div>
      
      <div className="property-list">
        {filteredProperties.map(property => {
          const city = cities.find(c => c.id === property.cityId);
          const isOwned = gameState.player.ownedProperties.includes(property.id);
          
          return (
            <div key={property.id} className={`property-card ${isOwned ? 'owned' : ''}`}>
              <h3>{property.name}</h3>
              <p className="city-name">{city?.name}</p>
              <p className="category">分類: {property.category}</p>
              <div className="property-info">
                <span className="income">収益: {property.baseIncome.toLocaleString()} G/ターン</span>
                <span className="price">価格: {property.purchasePrice.toLocaleString()} G</span>
              </div>
              {isOwned ? (
                <div className="owned-badge">所有中</div>
              ) : (
                <button 
                  onClick={() => buyProperty(property.id)}
                  disabled={gameState.player.money < property.purchasePrice}
                  className="buy-btn"
                >
                  買収
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
