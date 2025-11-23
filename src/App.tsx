import { useMemo, useState, useEffect } from 'react'
import './App.css'
import type { GameState, Property, GroupTechnique } from './types/game'
import {
  createInitialGameState,
  calculateTotalAssets,
  calculateDailyIncome,
  increaseIndependenceRisk,
  checkPropertyIndependence,
} from './data/gameState'
import { PropertyView } from './components/PropertyView'
import { GameHeader } from './components/GameHeader'
import { GroupTechniqueView } from './components/GroupTechniqueView'
import { NegotiationTechniqueView } from './components/NegotiationTechniqueView'
import { AcquisitionBattleComponent, type TradeResolution } from './components/AcquisitionBattle'
import { cities } from './data/cities'
import { useNotifications } from './context/NotificationContext'

const QUEST_TARGETS: Record<number, number> = {
  1: 100_000_000,
  2: 200_000_000,
  3: 300_000_000,
}

const LOCAL_STORAGE_KEY = 'romasaga-trade-state'

const computeQuestStage = (totalAssets: number): number => {
  if (totalAssets >= QUEST_TARGETS[3]) return 3
  if (totalAssets >= QUEST_TARGETS[2]) return 2
  return 1
}

const syncDerivedState = (state: GameState): GameState => {
  const totalAssets = calculateTotalAssets(
    state.player.capital,
    state.player.ownedProperties,
    state.properties
  )

  return {
    ...state,
    player: {
      ...state.player,
      totalAssets,
      questStage: computeQuestStage(totalAssets),
    },
  }
}

const unlockGroupTechniques = (
  ownedPropertyIds: string[],
  groupTechniques: GroupTechnique[]
) => {
  const newlyUnlocked: string[] = []
  const updated = groupTechniques.map(tech => {
    if (tech.isUnlocked) return tech
    const completed = tech.propertyIds.every(id => ownedPropertyIds.includes(id))
    if (completed) {
      newlyUnlocked.push(tech.id)
      return { ...tech, isUnlocked: true }
    }
    return tech
  })

  return { updated, newlyUnlocked }
}

const shouldUnlockNegotiationTechnique = (
  techniqueId: string,
  property: Property,
  state: GameState,
  ownedCount: number
): boolean => {
  switch (techniqueId) {
    case 'smile':
      return ownedCount >= 1
    case 'small_present':
      return /工|製/.test(property.category)
    case 'image_down':
      return property.category.includes('出版') || property.category.includes('酒')
    case 'era_wind':
      return property.basePrice >= 150000
    case 'preach_justice':
      return ownedCount >= 4
    case 'fast_horse':
      return property.category.includes('牧') || property.category.includes('馬')
    case 'false_info':
      return property.category.includes('出版') || property.group.includes('information')
    case 'hospitality':
      return property.category.includes('酒') || property.category.includes('カフェ')
    case 'fullbright_speech':
      return state.player.capital >= 1_000_000
    case 'consult_everyone':
      return ownedCount >= 6
    case 'cool_as_ice':
      return /氷|魚|冷/.test(property.description)
    case 'seki_wo_tatsu':
      return property.basePrice >= 200000
    case 'independence_work':
      return /パブ|酒/.test(property.category)
    case 'nemawashi':
      return property.category.includes('小麦') || property.category.includes('農')
    case 'professor_dance':
      return property.name.includes('教授')
    default:
      return false
  }
}

const unlockNegotiationTechniques = (
  property: Property,
  state: GameState,
  ownedPropertyIds: string[]
) => {
  const newlyUnlocked: string[] = []
  const updated = state.negotiationTechniques.map(tech => {
    if (tech.isUnlocked) return tech
    if (shouldUnlockNegotiationTechnique(tech.id, property, state, ownedPropertyIds.length)) {
      newlyUnlocked.push(tech.id)
      return { ...tech, isUnlocked: true }
    }
    return tech
  })

  return { updated, newlyUnlocked }
}

function App() {
  const [gameState, setGameStateInternal] = useState<GameState>(() => syncDerivedState(createInitialGameState()))
  const [activeTab, setActiveTab] = useState<'properties' | 'groups' | 'techniques'>('properties')
  const [activePanel, setActivePanel] = useState<'player' | 'content' | 'trade'>('content')
  const [activeTrade, setActiveTrade] = useState<Property | null>(null)
  const { notify } = useNotifications()

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as GameState
        setGameStateInternal(syncDerivedState(parsed))
      }
    } catch (error) {
      console.warn('save data restore failed', error)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gameState))
  }, [gameState])

  const setGameState: React.Dispatch<React.SetStateAction<GameState>> = (value) => {
    setGameStateInternal(prev => {
      const next = typeof value === 'function' ? (value as (prev: GameState) => GameState)(prev) : value
      return syncDerivedState(next)
    })
  }

  const dailyIncome = useMemo(
    () => calculateDailyIncome(gameState.player.ownedProperties, gameState.properties),
    [gameState.player.ownedProperties, gameState.properties]
  )
  const questTarget = QUEST_TARGETS[gameState.player.questStage] ?? QUEST_TARGETS[1]
  const questProgress = Math.min(100, (gameState.player.totalAssets / questTarget) * 100)

  const ownedPropertyDetails = useMemo(
    () => gameState.properties.filter(property => property.ownerId === 'player').sort((a, b) => b.income - a.income),
    [gameState.properties]
  )
  const cityNameMap = useMemo(() => {
    const entries = new Map<string, string>()
    cities.forEach(city => entries.set(city.id, city.name))
    return entries
  }, [])
  const unlockedGroups = gameState.groupTechniques.filter(tech => tech.isUnlocked).length
  const unlockedNegotiations = gameState.negotiationTechniques.filter(tech => tech.isUnlocked).length

  const handleTradeRequested = (property: Property) => {
    setActiveTrade(property)
    if (window.matchMedia('(max-width: 900px)').matches) {
      setActivePanel('trade')
    }
  }

  const openPropertyPanel = () => {
    setActivePanel('content')
  }

  const handleTradeCancelled = () => {
    setActiveTrade(null)
    notify('info', 'トレード交渉を終了しました')
  }

  const spendCapital = (amount: number): boolean => {
    if (amount <= 0) return true
    let succeeded = false
    setGameState(prev => {
      if (prev.player.capital < amount) {
        return prev
      }
      succeeded = true
      return {
        ...prev,
        player: {
          ...prev.player,
          capital: prev.player.capital - amount,
        },
      }
    })
    if (!succeeded) {
      notify('warning', '資金が不足しています')
    }
    return succeeded
  }

  const adjustPropertyRisk = (propertyId: string, amount: number) => {
    let independenceTriggered = false
    let affectedName = ''
    setGameState(prev => {
      const bumped = increaseIndependenceRisk(propertyId, amount, prev.properties)
      const property = bumped.find(p => p.id === propertyId)
      if (!property) return prev
      affectedName = property.name
      independenceTriggered = checkPropertyIndependence(propertyId, bumped)
      const normalizedProperties = independenceTriggered
        ? bumped.map(p => (p.id === propertyId ? { ...p, ownerId: null, independenceRisk: 20 } : p))
        : bumped
      const updatedOwned = independenceTriggered
        ? prev.player.ownedProperties.filter(id => id !== propertyId)
        : prev.player.ownedProperties

      return {
        ...prev,
        properties: normalizedProperties,
        player: {
          ...prev.player,
          ownedProperties: updatedOwned,
        },
      }
    })

    if (independenceTriggered && affectedName) {
      notify('warning', `${affectedName} が独立してしまいました…`)
    }
  }

  const handleTradeComplete = (resolution: TradeResolution) => {
    const property = activeTrade
    setActiveTrade(null)

    if (!property) return

    if (!resolution.success) {
      notify('error', `${property.name} の買収に失敗しました…`)
      return
    }

    setGameState(prev => {
      const ownedPropertyIds = [...prev.player.ownedProperties, property.id]
      const effectiveFunds = resolution.externalFunds + resolution.capitalContribution
      const remainingCost = Math.max(property.basePrice - effectiveFunds, 0)

      if (prev.player.capital < remainingCost) {
        notify('error', '資金不足のため契約締結に至りませんでした')
        return prev
      }

      const updatedProperties = prev.properties.map(p =>
        p.id === property.id
          ? { ...p, ownerId: 'player', independenceRisk: Math.max(p.independenceRisk - 10, 0) }
          : p
      )

      const { updated: updatedGroups, newlyUnlocked: newGroupIds } = unlockGroupTechniques(ownedPropertyIds, prev.groupTechniques)
      const { updated: updatedNegotiations, newlyUnlocked: newNegotiationIds } = unlockNegotiationTechniques(property, prev, ownedPropertyIds)

      if (remainingCost > 0) {
        notify('info', `${remainingCost.toLocaleString()} G を最終支払いとして投入しました`)
      }

      return {
        ...prev,
        player: {
          ...prev.player,
          capital: prev.player.capital - remainingCost,
          ownedProperties: ownedPropertyIds,
          unlockedGroupTechniques: Array.from(new Set([...prev.player.unlockedGroupTechniques, ...newGroupIds])),
          unlockedNegotiationTechniques: Array.from(new Set([...prev.player.unlockedNegotiationTechniques, ...newNegotiationIds])),
        },
        properties: updatedProperties,
        groupTechniques: updatedGroups,
        negotiationTechniques: updatedNegotiations,
      }
    })

    notify('success', `${property.name} の買収に成功しました！`)
  }

  return (
    <div className="app-shell">
      <div className="background-texture" aria-hidden />

      <header className="top-bar">
        <div className="top-bar-brand">Trade Legends</div>
        <div className="top-bar-stats">
          <span className="top-stat">💰 {gameState.player.capital.toLocaleString()} G</span>
          <span className="top-stat">📊 {gameState.player.totalAssets.toLocaleString()} G</span>
          <span className="top-stat">📈 +{dailyIncome.toLocaleString()} G/日</span>
        </div>
      </header>

      <div className="game-layout">
        <aside className={`sidebar ${activePanel === 'player' ? 'mobile-active' : ''}`}>
          <div className="brand-mark">
            <p className="eyebrow">Romancing SaGa III</p>
            <h1>Trade Legends</h1>
          </div>
          <GameHeader gameState={gameState} />
          <section className="sidebar-card stats-card">
            <h3>資産状況</h3>
            <div className="stat-grid">
              <div className="stat-pill">
                <span>現在資金</span>
                <strong>{gameState.player.capital.toLocaleString()} G</strong>
              </div>
              <div className="stat-pill">
                <span>総資産</span>
                <strong>{gameState.player.totalAssets.toLocaleString()} G</strong>
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
                {ownedPropertyDetails.slice(0, 5).map(property => (
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
            <button className={activeTab === 'properties' ? 'active' : ''} onClick={() => setActiveTab('properties')}>
              🏢 物件管理
            </button>
            <button className={activeTab === 'groups' ? 'active' : ''} onClick={() => setActiveTab('groups')}>
              🔗 グループ技
            </button>
            <button className={activeTab === 'techniques' ? 'active' : ''} onClick={() => setActiveTab('techniques')}>
              💡 かけひき技
            </button>
          </div>

          <div className="panel-surface">
            {activeTab === 'properties' && (
              <PropertyView
                gameState={gameState}
                setGameState={setGameState}
                onTradeRequested={handleTradeRequested}
                onMoveCity={(cityId) => setGameState(prev => ({
                  ...prev,
                  player: {
                    ...prev.player,
                    currentCityId: cityId,
                  },
                }))}
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

        <aside className={`trade-panel ${activePanel === 'trade' ? 'mobile-active' : ''}`}>
          {activeTrade ? (
            <AcquisitionBattleComponent
              property={activeTrade}
              gameState={gameState}
              onComplete={handleTradeComplete}
              onCancel={handleTradeCancelled}
              onSpendCapital={spendCapital}
              onAdjustPropertyRisk={adjustPropertyRisk}
            />
          ) : (
            <div className="trade-panel-placeholder">
              <div className="placeholder-icon">🎮</div>
              <h3>トレードセンター</h3>
              <p>物件一覧からターゲットを選んで交渉を始めましょう。</p>
              <div className="trade-panel-metrics">
                <div>
                  <small>保有資金</small>
                  <strong>{gameState.player.capital.toLocaleString()} G</strong>
                </div>
                <div>
                  <small>解放済み技</small>
                  <strong>
                    {unlockedNegotiations}/{gameState.negotiationTechniques.length}
                  </strong>
                </div>
              </div>
              <ul className="trade-placeholder-steps">
                <li>1. 物件管理タブで買収したい物件を選択</li>
                <li>2. ステータスを確認しながら資金計画</li>
                <li>3. 交渉技を駆使してゲージを自社側に!</li>
              </ul>
              <button type="button" className="trade-panel-action" onClick={openPropertyPanel}>
                物件一覧へ戻る
              </button>
            </div>
          )}
        </aside>
      </div>

      <nav className="bottom-nav">
        <button className={activePanel === 'player' ? 'active' : ''} onClick={() => setActivePanel('player')}>
          <span>👤</span>
          <small>プレイヤー</small>
        </button>
        <button className={activePanel === 'content' ? 'active' : ''} onClick={() => setActivePanel('content')}>
          <span>📋</span>
          <small>管理</small>
        </button>
        <button className={activePanel === 'trade' ? 'active' : ''} onClick={() => setActivePanel('trade')}>
          <span>🎮</span>
          <small>トレード</small>
        </button>
      </nav>
    </div>
  )
}

export default App
