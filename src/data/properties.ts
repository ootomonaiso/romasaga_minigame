// ロマサガ3 物件データ（一部抜粋）
import { Property } from '../types/game';

export const properties: Property[] = [
  // バンガード
  { id: 'prop_001', name: 'ルーブのひつじかい', cityId: 'vanguard', category: 'ルーブ織', baseIncome: 5000, purchasePrice: 50000, owned: false },
  { id: 'prop_002', name: 'ネッドのルーブ織工房', cityId: 'vanguard', category: 'ルーブ織', baseIncome: 8000, purchasePrice: 80000, owned: false },
  { id: 'prop_003', name: 'グッドフェローズ', cityId: 'vanguard', category: '西風のめぐみ', baseIncome: 6000, purchasePrice: 60000, owned: false },
  { id: 'prop_004', name: 'バンガードタイムズ', cityId: 'vanguard', category: '情報', baseIncome: 7000, purchasePrice: 100000, owned: false },
  { id: 'prop_005', name: 'オコンネル水産', cityId: 'vanguard', category: '西風のめぐみ', baseIncome: 6000, purchasePrice: 70000, owned: false },
  
  // ヤーマス
  { id: 'prop_011', name: 'ヤーマス牧羊ギルド', cityId: 'yamas', category: '大いなる北の大地', baseIncome: 5500, purchasePrice: 55000, owned: false },
  { id: 'prop_012', name: 'ヤーマスビール', cityId: 'yamas', category: '酒', baseIncome: 7000, purchasePrice: 75000, owned: false },
  { id: 'prop_013', name: 'ヤーマス塩鉱', cityId: 'yamas', category: '大いなる北の大地', baseIncome: 6500, purchasePrice: 70000, owned: false },
  
  // モウゼス
  { id: 'prop_021', name: 'モウゼスワイン', cityId: 'moses', category: '酒', baseIncome: 8000, purchasePrice: 85000, owned: false },
  { id: 'prop_022', name: 'モウゼスグレイン', cityId: 'moses', category: '西風のめぐみ', baseIncome: 5000, purchasePrice: 50000, owned: false },
  { id: 'prop_023', name: 'マジシャンギルド', cityId: 'moses', category: 'ポーション', baseIncome: 9000, purchasePrice: 120000, owned: false },
  
  // アケ（ジャングルフィーバーグループ）
  { id: 'prop_031', name: 'オーロラコーヒー', cityId: 'ake', category: 'ジャングルフィーバー', baseIncome: 7000, purchasePrice: 75000, owned: false },
  { id: 'prop_032', name: 'アケさとうきび農場', cityId: 'ake', category: 'ジャングルフィーバー', baseIncome: 6000, purchasePrice: 65000, owned: false },
  { id: 'prop_033', name: 'アケ木材', cityId: 'ake', category: 'ジャングルフィーバー', baseIncome: 5500, purchasePrice: 60000, owned: false },
  { id: 'prop_034', name: 'アケスパイス', cityId: 'ake', category: 'ジャングルフィーバー', baseIncome: 8000, purchasePrice: 90000, owned: false },
  { id: 'prop_035', name: 'コバルカンパニー', cityId: 'ake', category: 'ジャングルフィーバー', baseIncome: 7500, purchasePrice: 85000, owned: false },
  
  // ピドナ
  { id: 'prop_041', name: 'ハンス商会', cityId: 'pidona', category: 'クラウディウス', baseIncome: 8000, purchasePrice: 100000, owned: false },
  { id: 'prop_042', name: 'メッサーナワイン', cityId: 'pidona', category: 'マンマ・メッサーナ', baseIncome: 9000, purchasePrice: 110000, owned: false },
  { id: 'prop_043', name: 'ピドナ水産', cityId: 'pidona', category: 'マンマ・メッサーナ', baseIncome: 7000, purchasePrice: 80000, owned: false },
  { id: 'prop_044', name: 'レオナルド武器工房', cityId: 'pidona', category: 'メッサーナ工房', baseIncome: 8500, purchasePrice: 95000, owned: false },
  
  // ランス
  { id: 'prop_051', name: 'ステファンブルワリー', cityId: 'lance', category: '酒', baseIncome: 7500, purchasePrice: 80000, owned: false },
  { id: 'prop_052', name: 'ランス工房', cityId: 'lance', category: 'イスカル水運', baseIncome: 8000, purchasePrice: 90000, owned: false },
  { id: 'prop_053', name: 'イスカル水運', cityId: 'lance', category: 'イスカル水運', baseIncome: 9000, purchasePrice: 110000, owned: false },
  
  // ツヴァイク
  { id: 'prop_061', name: 'ツヴァイクビール', cityId: 'zweig', category: 'ツヴァイクのいぶくろ', baseIncome: 7000, purchasePrice: 75000, owned: false },
  { id: 'prop_062', name: 'ツヴァイク武器工房', cityId: 'zweig', category: 'ツヴァイク工房', baseIncome: 8500, purchasePrice: 95000, owned: false },
  { id: 'prop_063', name: 'ツヴァイクキャラバン', cityId: 'zweig', category: 'クラウディウス', baseIncome: 7500, purchasePrice: 85000, owned: false },
  
  // ファルス
  { id: 'prop_071', name: 'ファルスワイン', cityId: 'falce', category: '酒', baseIncome: 8000, purchasePrice: 85000, owned: false },
  { id: 'prop_072', name: 'ファルス造船', cityId: 'falce', category: 'イスカル水運', baseIncome: 10000, purchasePrice: 130000, owned: false },
];
