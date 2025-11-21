import { useState } from 'react'
import './App.css'
import type { GameState } from './types/game'
import { createInitialGameState } from './data/gameState'
import { CityView } from './components/CityView'
import { InventoryView } from './components/InventoryView'
import { PropertyView } from './components/PropertyView'
import { GameHeader } from './components/GameHeader'

function App() {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState())
  const [activeTab, setActiveTab] = useState<'trade' | 'property' | 'inventory'>('trade')

  return (
    <div className="app">
      <GameHeader gameState={gameState} />
      
      <div className="tab-buttons">
        <button 
          className={activeTab === 'trade' ? 'active' : ''}
          onClick={() => setActiveTab('trade')}
        >
          交易
        </button>
        <button 
          className={activeTab === 'property' ? 'active' : ''}
          onClick={() => setActiveTab('property')}
        >
          物件買収
        </button>
        <button 
          className={activeTab === 'inventory' ? 'active' : ''}
          onClick={() => setActiveTab('inventory')}
        >
          所持品
        </button>
      </div>

      <div className="main-content">
        {activeTab === 'trade' && (
          <CityView gameState={gameState} setGameState={setGameState} />
        )}
        {activeTab === 'property' && (
          <PropertyView gameState={gameState} setGameState={setGameState} />
        )}
        {activeTab === 'inventory' && (
          <InventoryView gameState={gameState} />
        )}
      </div>
    </div>
  )
}

export default App
