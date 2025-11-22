// ゲーム状態の初期化とユーティリティ関数
import type { GameState, PlayerState, Property, GroupTechnique } from '../types/game';
import { cities } from './cities';
import { properties } from './properties';
import { groupTechniques } from './groupTechniques';
import { negotiationTechniques } from './negotiationTechniques';

// 初期プレイヤー状態
export const createInitialPlayerState = (): PlayerState => ({
  companyName: 'プレイヤー商会',
  capital: 300000, // 初期資金30万オーラム
  totalAssets: 300000,
  currentCityId: 'vanguard', // バンガードからスタート
  ownedProperties: [],
  unlockedGroupTechniques: [],
  unlockedNegotiationTechniques: [],
  currentDay: 1,
  questStage: 1, // クエスト第一段階（1億オーラム目標）
});

// 初期ゲーム状態
export const createInitialGameState = (): GameState => ({
  player: createInitialPlayerState(),
  cities,
  properties: properties.map(p => ({ ...p })),
  groupTechniques: groupTechniques.map(g => ({ ...g })),
  negotiationTechniques: negotiationTechniques.map(n => ({ ...n })),
  currentBattle: null,
});

// 総資産の計算
export const calculateTotalAssets = (
  capital: number, 
  ownedProperties: string[], 
  properties: Property[]
): number => {
  const propertiesValue = ownedProperties.reduce((total, propId) => {
    const property = properties.find(p => p.id === propId);
    return total + (property?.basePrice || 0);
  }, 0);
  
  return capital + propertiesValue;
};

// 日々の収入計算
export const calculateDailyIncome = (
  ownedProperties: string[], 
  properties: Property[]
): number => {
  return ownedProperties.reduce((total, propId) => {
    const property = properties.find(p => p.id === propId);
    return total + (property?.income || 0);
  }, 0);
};

// 独立危険度の色を取得
export const getIndependenceRiskColor = (risk: number): string => {
  if (risk === 0) return '#000000'; // 黒
  if (risk < 32) return '#4169e1'; // 青
  if (risk < 64) return '#ffd700'; // 黄
  if (risk < 96) return '#ff4500'; // 赤
  return '#808080'; // グレー
};

// 独立危険度のラベルを取得
export const getIndependenceRiskLabel = (risk: number): string => {
  if (risk === 0) return '非常に安全';
  if (risk < 32) return '安全';
  if (risk < 64) return '注意';
  if (risk < 96) return '危険';
  return '独立の危機';
};

// グループ技の習得判定
export const checkGroupTechniqueUnlock = (
  propertyId: string,
  ownedProperties: string[],
  groupTechniques: GroupTechnique[]
): string[] => {
  const unlockedIds: string[] = [];
  
  groupTechniques.forEach(tech => {
    if (!tech.isUnlocked && tech.propertyIds.includes(propertyId)) {
      // この物件を所有していて、グループ内の物件を1つ以上所有している
      const hasGroupProperty = tech.propertyIds.some(id => ownedProperties.includes(id));
      if (hasGroupProperty) {
        // ランダムで閃く（50%の確率）
        if (Math.random() > 0.5) {
          unlockedIds.push(tech.id);
        }
      }
    }
  });
  
  return unlockedIds;
};

// かけひき技の習得判定（簡易版）
export const checkNegotiationTechniqueUnlock = (): boolean => {
  // 簡易的な判定ロジック
  // 実際はもっと複雑な条件チェックが必要
  return Math.random() > 0.7; // 30%の確率で習得
};

// 物件の買収可能判定
export const canAcquireProperty = (
  propertyId: string,
  playerCapital: number,
  properties: Property[]
): { canAcquire: boolean; reason?: string } => {
  const property = properties.find(p => p.id === propertyId);
  
  if (!property) {
    return { canAcquire: false, reason: '物件が見つかりません' };
  }
  
  if (property.ownerId === 'player') {
    return { canAcquire: false, reason: 'すでに所有しています' };
  }
  
  if (playerCapital < property.basePrice * 0.3) {
    return { canAcquire: false, reason: '資金が不足しています（相場の30%以上必要）' };
  }
  
  return { canAcquire: true };
};

// 物件からの資金要求額計算
export const calculatePropertyFunding = (
  propertyId: string,
  properties: Property[]
): number => {
  const property = properties.find(p => p.id === propertyId);
  if (!property || property.ownerId !== 'player') return 0;
  
  // 基本額は収入の2倍
  const baseAmount = property.income * 2;
  
  // 独立危険度によるペナルティ（危険度が高いほど資金が少ない）
  const riskPenalty = 1 - (property.independenceRisk / 256);
  
  return Math.floor(baseAmount * riskPenalty);
};

// グループ技からの資金要求額計算
export const calculateGroupFunding = (
  groupTechniqueId: string,
  groupTechniques: GroupTechnique[],
  ownedProperties: string[]
): number => {
  const tech = groupTechniques.find(t => t.id === groupTechniqueId);
  if (!tech || !tech.isUnlocked) return 0;
  
  // 所有している物件の数に応じてボーナス
  const ownedCount = tech.propertyIds.filter(id => ownedProperties.includes(id)).length;
  const totalCount = tech.propertyIds.length;
  const ownershipRatio = ownedCount / totalCount;
  
  return Math.floor(tech.baseAmount * ownershipRatio);
};

// 独立危険度の上昇
export const increaseIndependenceRisk = (
  propertyId: string,
  amount: number,
  properties: Property[]
): Property[] => {
  return properties.map(p => {
    if (p.id === propertyId && p.ownerId === 'player') {
      return {
        ...p,
        independenceRisk: Math.min(128, p.independenceRisk + amount),
      };
    }
    return p;
  });
};

// 物件の独立判定
export const checkPropertyIndependence = (
  propertyId: string,
  properties: Property[]
): boolean => {
  const property = properties.find(p => p.id === propertyId);
  if (!property || property.ownerId !== 'player') return false;
  
  // 独立危険度が128に達したら独立
  return property.independenceRisk >= 128;
};
