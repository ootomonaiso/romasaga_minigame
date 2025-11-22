// ロマサガ3 トレードゲームの型定義

// 都市
export interface City {
  id: string;
  name: string;
  region: string;
  description: string;
}

// 物件
export interface Property {
  id: string;
  name: string;
  cityId: string;
  category: string; // 品目（小麦、織物、造船など）
  group: string; // グループ名
  basePrice: number; // 相場価格
  income: number; // 日々の収入
  independenceRisk: number; // 独立危険度（0-128）
  ownerId: string | null; // 所有者ID（null=未所有、'player'=プレイヤー所有）
  description: string;
}

// グループ技
export interface GroupTechnique {
  id: string;
  name: string;
  propertyIds: string[]; // 所属物件ID
  isUnlocked: boolean; // 習得済みかどうか
  baseAmount: number; // 基本獲得資金額
  description: string;
}

// かけひき技
export interface NegotiationTechnique {
  id: string;
  name: string;
  cost: number; // 使用コスト
  effect: string; // 効果の種類（'accel', 'speed', 'time', 'risk'など）
  effectValue: number; // 効果の値
  isUnlocked: boolean; // 習得済みかどうか
  unlockCondition: string; // 習得条件の説明
  description: string;
}

// プレイヤー状態
export interface PlayerState {
  companyName: string; // 商会名
  capital: number; // 現在資金
  totalAssets: number; // 総資産
  currentCityId: string; // 現在いる都市
  ownedProperties: string[]; // 所有物件ID
  unlockedGroupTechniques: string[]; // 習得済みグループ技ID
  unlockedNegotiationTechniques: string[]; // 習得済みかけひき技ID
  currentDay: number; // 現在の日数
  questStage: number; // クエスト段階（1-3）
}

// 買収劇の状態
export interface AcquisitionBattle {
  propertyId: string;
  opponentCompany: string;
  opponentCapital: number;
  gaugeValue: number; // ゲージ現在値（0-65535、32768が中央）
  gaugeSpeed: number; // ゲージ移動速度
  playerAcceleration: number; // プレイヤー側ゲージ加速度（1-255）
  opponentAcceleration: number; // 相手側ゲージ加速度（1-255）
  playerCommandWaitTime: number; // プレイヤーのコマンド待ち時間（フレーム）
  opponentCommandWaitTime: number; // 相手のコマンド待ち時間（フレーム）
  battleDay: number; // 買収劇内の日数
  isPlayerTurn: boolean; // プレイヤーのターンかどうか
}

// ゲーム全体の状態
export interface GameState {
  player: PlayerState;
  cities: City[];
  properties: Property[];
  groupTechniques: GroupTechnique[];
  negotiationTechniques: NegotiationTechnique[];
  currentBattle: AcquisitionBattle | null; // 買収劇中の場合のみ
}
