// 都市ビュー - 交易画面
import type { GameState } from '../types/game';
import { cities } from '../data/cities';
import { items } from '../data/items';
import { getItemPrice, calculateTravelCost, updatePrices } from '../data/gameState';
import { useState } from 'react';

interface CityViewProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

export const CityView = ({ gameState, setGameState }: CityViewProps) => {
  const [selectedCity, setSelectedCity] = useState(gameState.player.currentCity);
  const [tradeItem, setTradeItem] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  
  const currentCity = cities.find(c => c.id === gameState.player.currentCity);
  
  // アイテムを購入
  const buyItem = (itemId: string) => {
    const price = getItemPrice(gameState.prices, itemId, gameState.player.currentCity);
    if (!price) return;
    
    const totalCost = price.buyPrice * quantity;
    if (gameState.player.money < totalCost) {
      alert('所持金が足りません！');
      return;
    }
    
    if (price.stock < quantity) {
      alert('在庫が足りません！');
      return;
    }
    
    setGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        money: prev.player.money - totalCost,
        inventory: [
          ...prev.player.inventory.filter(i => i.itemId !== itemId),
          {
            itemId,
            quantity: (prev.player.inventory.find(i => i.itemId === itemId)?.quantity || 0) + quantity
          }
        ]
      },
      prices: prev.prices.map(p =>
        p.itemId === itemId && p.cityId === gameState.player.currentCity
          ? { ...p, stock: p.stock - quantity }
          : p
      )
    }));
    
    setTradeItem(null);
    setQuantity(1);
  };
  
  // アイテムを売却
  const sellItem = (itemId: string) => {
    const inventoryItem = gameState.player.inventory.find(i => i.itemId === itemId);
    if (!inventoryItem || inventoryItem.quantity < quantity) {
      alert('所持数が足りません！');
      return;
    }
    
    const price = getItemPrice(gameState.prices, itemId, gameState.player.currentCity);
    if (!price) return;
    
    const totalIncome = price.sellPrice * quantity;
    
    setGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        money: prev.player.money + totalIncome,
        inventory: prev.player.inventory
          .map(i => i.itemId === itemId ? { ...i, quantity: i.quantity - quantity } : i)
          .filter(i => i.quantity > 0)
      },
      prices: prev.prices.map(p =>
        p.itemId === itemId && p.cityId === gameState.player.currentCity
          ? { ...p, stock: p.stock + quantity }
          : p
      )
    }));
    
    setTradeItem(null);
    setQuantity(1);
  };
  
  // 都市間移動
  const travelToCity = () => {
    if (selectedCity === gameState.player.currentCity) return;
    
    const cost = calculateTravelCost(gameState.player.currentCity, selectedCity);
    if (gameState.player.money < cost) {
      alert('旅費が足りません！');
      return;
    }
    
    setGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        currentCity: selectedCity,
        money: prev.player.money - cost
      },
      turn: prev.turn + 1,
      prices: updatePrices(prev.prices)
    }));
  };
  
  return (
    <div className="city-view">
      <div className="city-selector">
        <h2>都市選択</h2>
        <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
          {cities.map(city => (
            <option key={city.id} value={city.id}>
              {city.name} ({city.description})
            </option>
          ))}
        </select>
        {selectedCity !== gameState.player.currentCity && (
          <button onClick={travelToCity} className="travel-btn">
            移動 (費用: {calculateTravelCost(gameState.player.currentCity, selectedCity)} オーラム)
          </button>
        )}
      </div>
      
      <div className="market">
        <h2>🏪 {currentCity?.name}の市場</h2>
        <div className="item-list">
          {items.map(item => {
            const price = getItemPrice(gameState.prices, item.id, gameState.player.currentCity);
            const inventoryItem = gameState.player.inventory.find(i => i.itemId === item.id);
            
            if (!price) return null;
            
            return (
              <div key={item.id} className="item-card">
                <h3>{item.name}</h3>
                <p className="category">{item.category}</p>
                <div className="price-info">
                  <span className="buy-price">買: {price.buyPrice} G</span>
                  <span className="sell-price">売: {price.sellPrice} G</span>
                  <span className="stock">在庫: {price.stock}</span>
                </div>
                {inventoryItem && (
                  <p className="inventory">所持: {inventoryItem.quantity}</p>
                )}
                <div className="actions">
                  <button onClick={() => setTradeItem(item.id)}>取引</button>
                </div>
                
                {tradeItem === item.id && (
                  <div className="trade-modal">
                    <input
                      type="number"
                      min="1"
                      max={Math.max(price.stock, inventoryItem?.quantity || 0)}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                    <button onClick={() => buyItem(item.id)} disabled={gameState.player.money < price.buyPrice * quantity}>
                      購入 ({(price.buyPrice * quantity).toLocaleString()} G)
                    </button>
                    {inventoryItem && inventoryItem.quantity > 0 && (
                      <button onClick={() => sellItem(item.id)}>
                        売却 (+{(price.sellPrice * quantity).toLocaleString()} G)
                      </button>
                    )}
                    <button onClick={() => setTradeItem(null)}>閉じる</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
