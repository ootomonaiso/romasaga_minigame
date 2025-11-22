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
    <header className="game-header">
      <h1>🎮 ロマンシングサガ3 トレードゲーム</h1>
      <div className="player-info">
        <div className="info-item">
          <span className="label">商会名:</span>
          <span className="value">{gameState.player.companyName}</span>
        </div>
        <div className="info-item">
          <span className="label">現在資金:</span>
          <span className="value gold">{gameState.player.capital.toLocaleString()} G</span>
        </div>
        <div className="info-item">
          <span className="label">総資産:</span>
          <span className="value assets">{gameState.player.totalAssets.toLocaleString()} G</span>
        </div>
        <div className="info-item">
          <span className="label">現在地:</span>
          <span className="value">{currentCity?.name || 'バンガード'}</span>
        </div>
        <div className="info-item">
          <span className="label">日数:</span>
          <span className="value">{gameState.player.currentDay}日目</span>
        </div>
        <div className="info-item quest-stage">
          <span className="label">クエスト:</span>
          <span className="value">{getQuestStageLabel(gameState.player.questStage)}</span>
        </div>
      </div>
    </header>
  );
};
