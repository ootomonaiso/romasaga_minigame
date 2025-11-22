import { useMemo, useState } from 'react'
import './App.css'
import type { GameState } from './types/game'
import { createInitialGameState, calculateTotalAssets, calculateDailyIncome } from './data/gameState'
import { PropertyView } from './components/PropertyView'
import { GameHeader } from './components/GameHeader'
import { GroupTechniqueView } from './components/GroupTechniqueView'
import { NegotiationTechniqueView } from './components/NegotiationTechniqueView'
import { cities } from './data/cities'

function App() {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState())
  const [activeTab, setActiveTab] = useState<'properties' | 'groups' | 'techniques'>('properties')
  const [activePanel, setActivePanel] = useState<'player' | 'content' | 'trade'>('content')
  const [isTradeActive, setIsTradeActive] = useState(false)

  // トレード開始時にモバイルでトレードパネルへ自動移動
  const handleTradeStart = () => {
    setIsTradeActive(true)
    // 画面幅1280px以下ならトレードパネルへ切り替え
    if (window.innerWidth <= 1280) {
      setActivePanel('trade')
    }
  }

  const handleTradeEnd = () => {
    setIsTradeActive(false)
  }

  // 総資産を更新
  const updatedTotalAssets = calculateTotalAssets(
    gameState.player.capital,
    gameState.player.ownedProperties,
    gameState.properties
  );
  const dailyIncome = calculateDailyIncome(gameState.player.ownedProperties, gameState.properties)
  const questTargets: Record<number, number> = {
    1: 100_000_000,
    2: 200_000_000,
    3: 300_000_000,
  }
  const questTarget = questTargets[gameState.player.questStage] ?? questTargets[1]
  const questProgress = Math.min(100, (updatedTotalAssets / questTarget) * 100)

  const ownedPropertyDetails = useMemo(
    () => gameState.properties.filter((property) => property.ownerId === 'player').sort((a, b) => b.income - a.income),
    [gameState.properties]
  )
  const cityNameMap = useMemo(() => {
    const entries = new Map<string, string>()
    cities.forEach((city) => entries.set(city.id, city.name))
    return entries
  }, [])
  const unlockedGroups = gameState.groupTechniques.filter((tech) => tech.isUnlocked).length
  const unlockedNegotiations = gameState.negotiationTechniques.filter((tech) => tech.isUnlocked).length

  return (
    <div className="app-shell">
      <div className="background-texture" aria-hidden />
      
      {/* トップバー（資金状況） */}
      <header className="top-bar">
        <div className="top-bar-brand">Trade Legends</div>
        <div className="top-bar-stats">
          <span className="top-stat">💰 {gameState.player.capital.toLocaleString()} G</span>
          <span className="top-stat">📊 {updatedTotalAssets.toLocaleString()} G</span>
          <span className="top-stat">📈 +{dailyIncome.toLocaleString()} G/日</span>
        </div>
      </header>

      <div className="game-layout">
        <aside className={`sidebar ${activePanel === 'player' ? 'mobile-active' : ''}`}>
          <div className="brand-mark">
            <p className="eyebrow">Romancing SaGa III</p>
            <h1>Trade Legends</h1>
          </div>
          <GameHeader gameState={{
            ...gameState,
            player: {
              ...gameState.player,
              totalAssets: updatedTotalAssets,
            },
          }} />
          <section className="sidebar-card stats-card">
            <h3>資産状況</h3>
            <div className="stat-grid">
              <div className="stat-pill">
                <span>現在資金</span>
                <strong>{gameState.player.capital.toLocaleString()} G</strong>
              </div>
              <div className="stat-pill">
                <span>総資産</span>
                <strong>{updatedTotalAssets.toLocaleString()} G</strong>
              </div>
              <div className="stat-pill">
                <span>日々の収入</span>
                <strong>{dailyIncome.toLocaleString()} G</strong>
              </div>
              <div className="stat-pill">
                <span>習得済み技</span>
                <strong>{unlockedGroups} / {gameState.groupTechniques.length} グループ</strong>
                <small>{unlockedNegotiations} かけひき技</small>
              </div>
            </div>
          </section>
          <section className="sidebar-card quest-card">
            <div className="quest-header">
              <div>
                <span>クエスト進捗</span>
                <strong>Stage {gameState.player.questStage}</strong>
              </div>
              <p className="quest-target">目標: {questTarget.toLocaleString()} G</p>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${questProgress}%` }} />
            </div>
            <p className="progress-value">{questProgress.toFixed(1)}% 達成</p>
          </section>
          <section className="sidebar-card owned-card">
            <div className="card-heading">
              <h3>所有物件トップ</h3>
              <span>{ownedPropertyDetails.length} 件所有</span>
            </div>
            {ownedPropertyDetails.length === 0 ? (
              <p className="empty-state">まだ物件を所有していません</p>
            ) : (
              <ul>
                {ownedPropertyDetails.slice(0, 5).map((property) => (
                  <li key={property.id}>
                    <div>
                      <p className="property-name">{property.name}</p>
                      <span className="city-chip">{cityNameMap.get(property.cityId)}</span>
                    </div>
                    <strong>+{property.income.toLocaleString()} G</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>

        <main className={`main-panel ${activePanel === 'content' ? 'mobile-active' : ''}`}>
          <div className="tab-bar">
            <button
              className={activeTab === 'properties' ? 'active' : ''}
              onClick={() => setActiveTab('properties')}
            >
              🏢 物件管理
            </button>
            <button
              className={activeTab === 'groups' ? 'active' : ''}
              onClick={() => setActiveTab('groups')}
            >
              🔗 グループ技
            </button>
            <button
              className={activeTab === 'techniques' ? 'active' : ''}
              onClick={() => setActiveTab('techniques')}
            >
              💡 かけひき技
            </button>
          </div>

          <div className="panel-surface">
            {activeTab === 'properties' && (
              <PropertyView 
                gameState={gameState} 
                setGameState={setGameState}
                onTradeStart={handleTradeStart}
                onTradeEnd={handleTradeEnd}
              />
            )}
            {activeTab === 'groups' && (
              <GroupTechniqueView gameState={gameState} setGameState={setGameState} />
            )}
            {activeTab === 'techniques' && (
              <NegotiationTechniqueView gameState={gameState} />
            )}
          </div>
        </main>

        {/* トレードパネル(PC時は右側固定) */}
        <aside className={`trade-panel ${activePanel === 'trade' ? 'mobile-active' : ''}`}>
          <div className="trade-panel-placeholder">
            <h3>🎮 トレードゲーム</h3>
            <p>物件を選択してトレード交渉を開始</p>
          </div>
        </aside>
      </div>

      {/* モバイルボトムナビ */}
      <nav className="bottom-nav">
        <button
          className={activePanel === 'player' ? 'active' : ''}
          onClick={() => setActivePanel('player')}
        >
          <span>👤</span>
          <small>プレイヤー</small>
        </button>
        <button
          className={activePanel === 'content' ? 'active' : ''}
          onClick={() => setActivePanel('content')}
        >
          <span>📋</span>
          <small>管理</small>
        </button>
        <button
          className={activePanel === 'trade' ? 'active' : ''}
          onClick={() => setActivePanel('trade')}
        >
          <span>🎮</span>
          <small>トレード</small>
        </button>
      </nav>
    </div>
  )
}

export default App
