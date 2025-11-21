// ゲーム状態の初期化とユーティリティ関数
import type { GameState, PriceData, PlayerState } from '../types/game';
import { cities } from './cities';
import { items } from './items';
import { properties } from './properties';

// 価格変動の計算
export const calculatePrice = (basePrice: number, cityFactor: number, randomFactor: number): number => {
  return Math.floor(basePrice * cityFactor * randomFactor);
};

// 初期価格データの生成
export const generateInitialPrices = (): PriceData[] => {
  const prices: PriceData[] = [];
  
  cities.forEach(city => {
    items.forEach(item => {
      // 都市ごとに異なる価格設定係数
      const cityFactor = 0.8 + Math.random() * 0.4; // 0.8 ~ 1.2
      const randomFactor = 0.9 + Math.random() * 0.2; // 0.9 ~ 1.1
      
      const buyPrice = calculatePrice(item.basePrice, cityFactor, randomFactor);
      const sellPrice = Math.floor(buyPrice * 0.7); // 売却価格は買取価格の70%
      const stock = Math.floor(20 + Math.random() * 30); // 在庫20~50
      
      prices.push({
        itemId: item.id,
        cityId: city.id,
        buyPrice,
        sellPrice,
        stock,
      });
    });
  });
  
  return prices;
};

// 価格の更新（ターン経過時）
export const updatePrices = (prices: PriceData[]): PriceData[] => {
  return prices.map(price => {
    const fluctuation = 0.95 + Math.random() * 0.1; // -5% ~ +5%
    return {
      ...price,
      buyPrice: Math.floor(price.buyPrice * fluctuation),
      sellPrice: Math.floor(price.sellPrice * fluctuation),
      stock: Math.max(10, Math.min(100, price.stock + Math.floor((Math.random() - 0.5) * 10))),
    };
  });
};

// 初期プレイヤー状態
export const createInitialPlayerState = (): PlayerState => ({
  money: 100000, // 初期資金10万オーラム
  inventory: [],
  currentCity: 'vanguard', // バンガードからスタート
  ownedProperties: [],
  reputation: 0,
});

// 初期ゲーム状態
export const createInitialGameState = (): GameState => ({
  player: createInitialPlayerState(),
  cities,
  items,
  properties: properties.map(p => ({ ...p })),
  prices: generateInitialPrices(),
  turn: 0,
});

// 都市間の移動コスト計算
export const calculateTravelCost = (fromCityId: string, toCityId: string): number => {
  if (fromCityId === toCityId) return 0;
  
  // 簡易的な距離計算（実際はもっと複雑）
  const baseCost = 500;
  return baseCost + Math.floor(Math.random() * 300);
};

// 特定アイテムの価格取得
export const getItemPrice = (prices: PriceData[], itemId: string, cityId: string): PriceData | undefined => {
  return prices.find(p => p.itemId === itemId && p.cityId === cityId);
};
