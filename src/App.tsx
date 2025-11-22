import { useState } from 'react'
import './App.css'
import type { GameState } from './types/game'
import { createInitialGameState, calculateTotalAssets } from './data/gameState'
import { PropertyView } from './components/PropertyView'
import { GameHeader } from './components/GameHeader'

function App() {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState())
  const [activeTab, setActiveTab] = useState<'properties' | 'groups' | 'techniques'>('properties')

  // 総資産を更新
  const updatedTotalAssets = calculateTotalAssets(
    gameState.player.capital,
    gameState.player.ownedProperties,
    gameState.properties
  );

  return (
    <div className="app">
      <GameHeader gameState={{
        ...gameState,
        player: {
          ...gameState.player,
          totalAssets: updatedTotalAssets
        }
      }} />
      
      <div className="tab-buttons">
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

      <div className="main-content">
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
    </div>
  )
}

export default App
