// ゲームヘッダー - プレイヤー情報表示
import type { GameState } from '../types/game';
import { cities } from '../data/cities';

interface GameHeaderProps {
  gameState: GameState;
}

export const GameHeader = ({ gameState }: GameHeaderProps) => {
  const currentCity = cities.find(c => c.id === gameState.player.currentCity);
  
  return (
    <header className="game-header">
      <h1>🎮 ロマンシングサガ3 トレードゲーム</h1>
      <div className="player-info">
        <div className="info-item">
          <span className="label">所持金:</span>
          <span className="value">{gameState.player.money.toLocaleString()} オーラム</span>
        </div>
        <div className="info-item">
          <span className="label">現在地:</span>
          <span className="value">{currentCity?.name || '不明'}</span>
        </div>
        <div className="info-item">
          <span className="label">評判:</span>
          <span className="value">{gameState.player.reputation} ポイント</span>
        </div>
        <div className="info-item">
          <span className="label">ターン:</span>
          <span className="value">{gameState.turn}</span>
        </div>
      </div>
    </header>
  );
};
