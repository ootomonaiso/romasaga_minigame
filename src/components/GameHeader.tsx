// ゲームヘッダー - プレイヤー情報表示
import type { GameState } from '../types/game';
import { cities } from '../data/cities';

interface GameHeaderProps {
  gameState: GameState;
}

export const GameHeader = ({ gameState }: GameHeaderProps) => {
  const currentCity = cities.find(c => c.id === gameState.player.currentCityId);
  
  // クエスト段階の表示
  const getQuestStageLabel = (stage: number): string => {
    switch (stage) {
      case 1: return '第一段階: 1億オーラムを目指す';
      case 2: return '第二段階: ドフォーレ商会を打倒';
      case 3: return '最終段階: アビスリーグを壊滅';
      default: return '完結';
    }
  };
  
  return (
    <header className="game-header compact">
      <div className="company-meta">
        <p className="eyebrow">商会</p>
        <h2>{gameState.player.companyName}</h2>
        <p className="quest-label">{getQuestStageLabel(gameState.player.questStage)}</p>
      </div>
      <div className="header-stats">
        <div className="header-stat">
          <span>現在地</span>
          <strong>{currentCity?.name || 'バンガード'}</strong>
        </div>
        <div className="header-stat">
          <span>日数</span>
          <strong>{gameState.player.currentDay}日目</strong>
        </div>
      </div>
    </header>
  );
};
