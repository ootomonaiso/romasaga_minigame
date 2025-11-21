// インベントリビュー - 所持品画面
import type { GameState } from '../types/game';
import { items } from '../data/items';

interface InventoryViewProps {
  gameState: GameState;
}

export const InventoryView = ({ gameState }: InventoryViewProps) => {
  const totalValue = gameState.player.inventory.reduce((sum, inv) => {
    const item = items.find(i => i.id === inv.itemId);
    return sum + (item?.basePrice || 0) * inv.quantity;
  }, 0);
  
  return (
    <div className="inventory-view">
      <h2>📦 所持品一覧</h2>
      <div className="inventory-summary">
        <p>所持金: {gameState.player.money.toLocaleString()} オーラム</p>
        <p>商品総額（概算）: {totalValue.toLocaleString()} オーラム</p>
        <p>総資産: {(gameState.player.money + totalValue).toLocaleString()} オーラム</p>
      </div>
      
      <div className="inventory-list">
        {gameState.player.inventory.length === 0 ? (
          <p className="empty-message">商品を所持していません</p>
        ) : (
          gameState.player.inventory.map(inv => {
            const item = items.find(i => i.id === inv.itemId);
            if (!item) return null;
            
            return (
              <div key={inv.itemId} className="inventory-item">
                <h3>{item.name}</h3>
                <div className="item-details">
                  <span className="category">{item.category}</span>
                  <span className="quantity">数量: {inv.quantity}</span>
                  <span className="value">価値: {(item.basePrice * inv.quantity).toLocaleString()} G</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
