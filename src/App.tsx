import { useMemo, useState } from 'react'
import './App.css'
import type { GameState } from './types/game'
import { createInitialGameState, calculateTotalAssets, calculateDailyIncome } from './data/gameState'
import { PropertyView } from './components/PropertyView'
import { GameHeader } from './components/GameHeader'
import { cities } from './data/cities'

function App() {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState())
  const [activeTab, setActiveTab] = useState<'properties' | 'groups' | 'techniques'>('properties')

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
      <div className="game-layout">
        <aside className="sidebar">
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

        <main className="main-panel">
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
              <PropertyView gameState={gameState} setGameState={setGameState} />
            )}
            {activeTab === 'groups' && (
              <div className="coming-soon">
                <h2>グループ技</h2>
                <p>実装予定: グループに所属する物件から一括で資金を要求する技</p>
                <div className="group-list">
                  {gameState.groupTechniques.map(tech => (
                    <div key={tech.id} className={`group-card ${tech.isUnlocked ? 'unlocked' : 'locked'}`}>
                      <h3>{tech.name}</h3>
                      <p>{tech.description}</p>
                      <p>基本獲得額: {tech.baseAmount.toLocaleString()} G</p>
                      <p>所属物件数: {tech.propertyIds.length}</p>
                      {tech.isUnlocked ? (
                        <span className="status">✓ 習得済み</span>
                      ) : (
                        <span className="status">🔒 未習得</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'techniques' && (
              <div className="coming-soon">
                <h2>かけひき技</h2>
                <p>実装予定: 買収劇で使える特殊技</p>
                <div className="technique-list">
                  {gameState.negotiationTechniques.map(tech => (
                    <div key={tech.id} className={`technique-card ${tech.isUnlocked ? 'unlocked' : 'locked'}`}>
                      <h3>{tech.name}</h3>
                      <p>{tech.description}</p>
                      <p>コスト: {tech.cost.toLocaleString()} G</p>
                      <p className="unlock-condition">習得条件: {tech.unlockCondition}</p>
                      {tech.isUnlocked ? (
                        <span className="status">✓ 習得済み</span>
                      ) : (
                        <span className="status">🔒 未習得</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
