// ロマサガ3 トレードゲームの型定義

export interface City {
  id: string;
  name: string;
  region: 'north' | 'south' | 'east' | 'west' | 'central';
  description?: string;
}

export interface Item {
  id: string;
  name: string;
  category: string;
  basePrice: number;
}

export interface Property {
  id: string;
  name: string;
  cityId: string;
  category: string;
  baseIncome: number;
  purchasePrice: number;
  owned: boolean;
  ownedBy?: string; // プレイヤーか他の商会
}

export interface PriceData {
  itemId: string;
  cityId: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
}

export interface PlayerState {
  money: number;
  inventory: { itemId: string; quantity: number }[];
  currentCity: string;
  ownedProperties: string[];
  reputation: number; // ポイント
}

export interface GameState {
  player: PlayerState;
  cities: City[];
  items: Item[];
  properties: Property[];
  prices: PriceData[];
  turn: number;
}
