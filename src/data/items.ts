// ロマサガ3 取引品目データ
import type { Item } from '../types/game';

export const items: Item[] = [
  // 食料・農産物
  { id: 'grain', name: '穀物', category: '農産物', basePrice: 100 },
  { id: 'fish', name: '魚', category: '食料', basePrice: 120 },
  { id: 'sugar', name: '砂糖', category: '農産物', basePrice: 150 },
  { id: 'salt', name: '塩', category: '鉱産物', basePrice: 80 },
  { id: 'spice', name: '香辛料', category: '農産物', basePrice: 200 },
  
  // 飲料
  { id: 'wine', name: 'ワイン', category: '酒', basePrice: 180 },
  { id: 'beer', name: 'ビール', category: '酒', basePrice: 150 },
  { id: 'tea', name: '茶', category: '飲料', basePrice: 160 },
  { id: 'coffee', name: 'コーヒー', category: '飲料', basePrice: 170 },
  
  // 繊維・織物
  { id: 'wool', name: '羊毛', category: '繊維', basePrice: 110 },
  { id: 'cotton', name: '綿', category: '繊維', basePrice: 120 },
  { id: 'silk', name: '絹', category: '繊維', basePrice: 250 },
  { id: 'cloth', name: '織物', category: '加工品', basePrice: 200 },
  { id: 'carpet', name: 'じゅうたん', category: '加工品', basePrice: 300 },
  { id: 'fur', name: '毛皮', category: '繊維', basePrice: 220 },
  
  // 木材・紙
  { id: 'wood', name: '木材', category: '木材', basePrice: 90 },
  { id: 'paper', name: '紙', category: '加工品', basePrice: 140 },
  
  // 鉱産物
  { id: 'iron', name: '鉄', category: '鉱産物', basePrice: 130 },
  { id: 'gold', name: '金', category: '貴金属', basePrice: 500 },
  { id: 'gem', name: '宝石', category: '貴金属', basePrice: 600 },
  
  // 工芸品・武器
  { id: 'weapon', name: '武器', category: '工芸品', basePrice: 280 },
  { id: 'tool', name: '農具', category: '工芸品', basePrice: 150 },
  { id: 'ceramic', name: '陶器', category: '工芸品', basePrice: 180 },
  
  // その他
  { id: 'potion', name: 'ポーション', category: '薬品', basePrice: 200 },
  { id: 'ship', name: '船', category: '大型商品', basePrice: 800 },
  { id: 'horse', name: '馬', category: '家畜', basePrice: 300 },
];
