// トレード交渉 - ストライプゲージによる交渉ミニゲーム
import { useState, useEffect, useMemo, useCallback } from 'react'
import type { AcquisitionBattle, Property, GameState } from '../types/game'
import {
  calculatePropertyFunding,
  calculateGroupFunding,
  getIndependenceRiskColor,
  getIndependenceRiskLabel,
} from '../data/gameState'
import { cities } from '../data/cities'

const GAUGE_MAX = 65535

type TradePhase = 'entry' | 'funding' | 'negotiation' | 'decision'

interface TradeLogEntry {
  id: string
  message: string
  tone: 'player' | 'opponent'
  timestamp: string
}

const tradePhaseSteps: Array<{ key: TradePhase; label: string; hint: string }> = [
  { key: 'entry', label: '状況確認', hint: 'ターゲットの把握' },
  { key: 'funding', label: '資金調達', hint: '出資元を確保' },
  { key: 'negotiation', label: '交渉', hint: '技で主導権を奪う' },
  { key: 'decision', label: '決着', hint: '勝負の瞬間' },
]

export interface TradeResolution {
  success: boolean
  playerFunds: number
  externalFunds: number
  capitalContribution: number
  opponentFunds: number
}

interface AcquisitionBattleProps {
  property: Property
  gameState: GameState
  onComplete: (resolution: TradeResolution) => void
  onCancel: () => void
  onSpendCapital: (amount: number) => boolean
  onAdjustPropertyRisk: (propertyId: string, amount: number) => void
}

export const AcquisitionBattleComponent = ({
  property,
  gameState,
  onComplete,
  onCancel,
  onSpendCapital,
  onAdjustPropertyRisk,
}: AcquisitionBattleProps) => {
  const [battle, setBattle] = useState<AcquisitionBattle>({
    propertyId: property.id,
    opponentCompany: property.ownerId || 'ライバル商会',
    opponentCapital: property.basePrice * 1.5,
    gaugeValue: GAUGE_MAX / 2,
    gaugeSpeed: 0,
    playerAcceleration: 10,
    opponentAcceleration: 8,
    playerCommandWaitTime: 100,
    opponentCommandWaitTime: 120,
    battleDay: 1,
    isPlayerTurn: true,
  })

  const [playerExternalFunds, setPlayerExternalFunds] = useState(0)
  const [playerCapitalContribution, setPlayerCapitalContribution] = useState(0)
  const [opponentFunds, setOpponentFunds] = useState(0)
  const [message, setMessage] = useState('トレードを開始します！')
  const [isAnimating, setIsAnimating] = useState(false)
  const [battleResult, setBattleResult] = useState<'victory' | 'defeat' | null>(null)
  const [phase, setPhase] = useState<TradePhase>('entry')
  const [actionLog, setActionLog] = useState<TradeLogEntry[]>(() => {
    const timestamp = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    return [
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        tone: 'player',
        message: `${property.name} のトレードを開始しました`,
        timestamp,
      },
    ]
  })

  const playerFunds = playerExternalFunds + playerCapitalContribution

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) => {
        const seeded = Math.sin(index * 17 + 1) * 10000
        const fractional = seeded - Math.floor(seeded)
        return {
          delay: `${index * 40}ms`,
          left: `${Math.round(fractional * 100)}%`,
        }
      }),
    []
  )

  const city = useMemo(() => cities.find(c => c.id === property.cityId), [property.cityId])
  const riskColor = useMemo(() => getIndependenceRiskColor(property.independenceRisk), [property.independenceRisk])
  const riskLabel = useMemo(() => getIndependenceRiskLabel(property.independenceRisk), [property.independenceRisk])
  const gaugePercentage = (battle.gaugeValue / GAUGE_MAX) * 100
  const phaseIndex = tradePhaseSteps.findIndex(step => step.key === phase)

  const addLogEntry = useCallback((tone: 'player' | 'opponent', entryMessage: string) => {
    const timestamp = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    setActionLog(prev => {
      const next = [
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
          tone,
          message: entryMessage,
          timestamp,
        },
        ...prev,
      ]
      return next.slice(0, 5)
    })
  }, [])

  const updateStatus = useCallback(
    (text: string, tone: 'player' | 'opponent' = 'player') => {
      setMessage(text)
      addLogEntry(tone, text)
    },
    [addLogEntry]
  )

  const concludeBattle = useCallback(
    (result: 'victory' | 'defeat') => {
      if (battleResult) return
      setBattleResult(result)
      setPhase('decision')
      updateStatus(result === 'victory' ? 'トレード成立！' : 'トレード失敗...', result === 'victory' ? 'player' : 'opponent')
      onComplete({
        success: result === 'victory',
        playerFunds,
        externalFunds: playerExternalFunds,
        capitalContribution: playerCapitalContribution,
        opponentFunds,
      })
    },
    [battleResult, onComplete, opponentFunds, playerCapitalContribution, playerExternalFunds, playerFunds, updateStatus]
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setBattle(prev => {
        const newGaugeValue = prev.gaugeValue + prev.gaugeSpeed

        if (newGaugeValue <= 0) {
          clearInterval(interval)
          concludeBattle('defeat')
          return prev
        }
        if (newGaugeValue >= GAUGE_MAX) {
          clearInterval(interval)
          concludeBattle('victory')
          return prev
        }

        let newSpeed = prev.gaugeSpeed
        if (playerFunds > opponentFunds) {
          newSpeed += prev.playerAcceleration / 10
        } else if (opponentFunds > playerFunds) {
          newSpeed -= prev.opponentAcceleration / 10
        }

        return {
          ...prev,
          gaugeValue: newGaugeValue,
          gaugeSpeed: newSpeed,
        }
      })
    }, 50)

    return () => clearInterval(interval)
  }, [playerFunds, opponentFunds, concludeBattle])

  const passTurnToOpponent = () => {
    setBattle(prev => ({ ...prev, isPlayerTurn: false }))
  }

  const requestFunds = () => {
    if (isAnimating || !battle.isPlayerTurn) return
    setIsAnimating(true)

    const ownedProps = gameState.properties.filter(p => p.ownerId === 'player')
    if (ownedProps.length === 0) {
      updateStatus('所有している物件がありません！')
      setIsAnimating(false)
      return
    }

    const randomProp = ownedProps[Math.floor(Math.random() * ownedProps.length)]
    const funds = calculatePropertyFunding(randomProp.id, gameState.properties)
    setPlayerExternalFunds(prev => prev + funds)
    onAdjustPropertyRisk(randomProp.id, 8)
    updateStatus(`${randomProp.name} から ${funds.toLocaleString()} G を調達！`)
    setPhase('funding')
    passTurnToOpponent()

    setTimeout(() => {
      updateStatus('物件の独立危険度が少し上昇...')
      setIsAnimating(false)
    }, 1000)
  }

  const requestGroupFunds = () => {
    if (isAnimating || !battle.isPlayerTurn) return
    setIsAnimating(true)

    const unlockedGroups = gameState.groupTechniques.filter(g => g.isUnlocked)
    if (unlockedGroups.length === 0) {
      updateStatus('習得しているグループ技がありません！')
      setIsAnimating(false)
      return
    }

    const randomGroup = unlockedGroups[Math.floor(Math.random() * unlockedGroups.length)]
    const funds = calculateGroupFunding(
      randomGroup.id,
      gameState.groupTechniques,
      gameState.player.ownedProperties
    )

    setPlayerExternalFunds(prev => prev + funds)
    updateStatus(`${randomGroup.name} から ${funds.toLocaleString()} G を獲得！（グループ）`)
    setPhase('funding')
    passTurnToOpponent()

    setTimeout(() => setIsAnimating(false), 1000)
  }

  const useNegotiation = () => {
    if (isAnimating || !battle.isPlayerTurn) return
    setIsAnimating(true)

    const unlockedTechs = gameState.negotiationTechniques.filter(t => t.isUnlocked)
    if (unlockedTechs.length === 0) {
      updateStatus('習得しているかけひき技がありません！')
      setIsAnimating(false)
      return
    }

    const technique = unlockedTechs[Math.floor(Math.random() * unlockedTechs.length)]
    if (technique.cost > 0 && !onSpendCapital(technique.cost)) {
      setIsAnimating(false)
      return
    }

    switch (technique.effect) {
      case 'accel_increase':
        setBattle(prev => ({
          ...prev,
          playerAcceleration: prev.playerAcceleration + technique.effectValue,
        }))
        updateStatus(`${technique.name} で加速度 +${technique.effectValue}`)
        break
      case 'opponent_accel_decrease':
        setBattle(prev => ({
          ...prev,
          opponentAcceleration: Math.max(1, prev.opponentAcceleration - technique.effectValue),
        }))
        updateStatus(`${technique.name} で相手の勢いを削いだ`)
        break
      case 'speed_increase':
        setBattle(prev => ({ ...prev, gaugeSpeed: prev.gaugeSpeed + technique.effectValue }))
        updateStatus(`${technique.name} が追い風を起こす！`)
        break
      case 'gauge_random': {
        const swing = Math.floor((Math.random() - 0.5) * technique.effectValue * 1024)
        setBattle(prev => ({
          ...prev,
          gaugeValue: Math.min(GAUGE_MAX, Math.max(0, prev.gaugeValue + swing)),
        }))
        updateStatus(`${technique.name} で情勢が大きく揺れ動いた！`)
        break
      }
      case 'command_time_half':
        setBattle(prev => ({
          ...prev,
          playerCommandWaitTime: Math.max(20, Math.floor(prev.playerCommandWaitTime / 2)),
        }))
        updateStatus('命令伝達が高速化！')
        break
      case 'opponent_time_double':
        setBattle(prev => ({
          ...prev,
          opponentCommandWaitTime: prev.opponentCommandWaitTime * 2,
        }))
        updateStatus('敵社の連絡網を混乱させた！', 'player')
        break
      case 'reset_time':
        setBattle(prev => ({
          ...prev,
          playerCommandWaitTime: 100,
          opponentCommandWaitTime: 120,
        }))
        updateStatus('情報を整理し直して落ち着きを取り戻した')
        break
      case 'speed_increase_next_day':
        updateStatus(`${technique.name} の準備を進めている…`)
        setTimeout(() => {
          setBattle(prev => ({ ...prev, gaugeSpeed: prev.gaugeSpeed + technique.effectValue }))
          updateStatus('もてなしが功を奏し、勢いが増した！')
        }, 900)
        break
      case 'random_persuade': {
        if (Math.random() < 0.34) {
          updateStatus('聴衆が味方し、一気に優勢に！')
          setBattle(prev => ({
            ...prev,
            gaugeValue: Math.min(GAUGE_MAX, prev.gaugeValue + Math.floor(GAUGE_MAX * 0.35)),
          }))
        } else {
          updateStatus(`${technique.name} は様子見となった…`)
        }
        break
      }
      case 'price_double':
        setBattle(prev => ({
          ...prev,
          gaugeSpeed: prev.gaugeSpeed * 0.6,
          playerAcceleration: Math.max(1, Math.floor(prev.playerAcceleration * 0.8)),
          opponentAcceleration: Math.max(1, Math.floor(prev.opponentAcceleration * 0.8)),
        }))
        updateStatus('相場が跳ね上がり、情勢が一気に鈍化')
        break
      case 'price_half':
        setBattle(prev => ({
          ...prev,
          gaugeSpeed: prev.gaugeSpeed + 15,
          playerAcceleration: prev.playerAcceleration + 2,
        }))
        updateStatus('大幅値引きにより攻勢を強めた！')
        break
      case 'opponent_risk_increase':
        onAdjustPropertyRisk(property.id, technique.effectValue)
        updateStatus('敵社の足元を揺さぶり、独立危険度が上昇！')
        break
      case 'risk_half': {
        const reduction = -Math.floor(property.independenceRisk / 2)
        onAdjustPropertyRisk(property.id, reduction)
        updateStatus('ネマワシが成功し、独立危険度が鎮静化')
        break
      }
      default:
        updateStatus(`${technique.name} を仕掛けた`)
        break
    }

    setPhase('negotiation')
    passTurnToOpponent()
    setTimeout(() => setIsAnimating(false), 1000)
  }

  const useOwnFunds = () => {
    if (isAnimating || !battle.isPlayerTurn) return
    setIsAnimating(true)

    const amount = Math.min(gameState.player.capital, Math.max(1000, property.basePrice * 0.05))
    if (amount < 1000) {
      updateStatus('投入できる資金が不足しています！')
      setIsAnimating(false)
      return
    }

    if (!onSpendCapital(amount)) {
      setIsAnimating(false)
      return
    }

    setPlayerCapitalContribution(prev => prev + amount)
    updateStatus(`自社資金 ${amount.toLocaleString()} G を追加投入！`)
    setPhase('funding')
    passTurnToOpponent()

    setTimeout(() => setIsAnimating(false), 1000)
  }

  const giveUp = () => {
    setPhase('decision')
    updateStatus('トレードから撤退しました')
    onCancel()
  }

  useEffect(() => {
    if (!battle.isPlayerTurn && !isAnimating) {
      const timer = setTimeout(() => {
        const opponentMove = Math.random()
        let funds = 0
        let moveMessage = ''

        if (opponentMove < 0.4 || playerFunds > opponentFunds + property.basePrice * 0.1) {
          funds = Math.floor(property.basePrice * 0.05 * (1 + Math.random()))
          moveMessage = `相手が資金を投入！ ${funds.toLocaleString()} G`
          setOpponentFunds(prev => prev + funds)
        } else if (opponentMove < 0.7) {
          setBattle(prev => ({
            ...prev,
            opponentAcceleration: prev.opponentAcceleration + 2,
          }))
          moveMessage = '相手が巧みな戦術で加速度を上げた'
        } else {
          setBattle(prev => ({
            ...prev,
            gaugeSpeed: prev.gaugeSpeed - 5,
          }))
          moveMessage = '相手が情報戦を仕掛けてきた'
        }

        updateStatus(moveMessage, 'opponent')
        setPhase('negotiation')
        setBattle(prev => ({ ...prev, isPlayerTurn: true }))
      }, 900)

      return () => clearTimeout(timer)
    }
  }, [battle.isPlayerTurn, isAnimating, property.basePrice, playerFunds, opponentFunds, updateStatus])

  const locationLabel = city?.name ?? '未知の都市';

  return (
    <div className="acquisition-battle-overlay">
      <div className="acquisition-battle battle-enter">
        {battleResult && (
          <div className={`battle-result ${battleResult}`}>
            <p>{battleResult === 'victory' ? 'トレード成立！' : 'トレード失敗...'}</p>
            <div className="confetti-spray">
              {confettiPieces.map((piece, index) => (
                <span
                  key={index}
                  style={{ animationDelay: piece.delay, left: piece.left }}
                />
              ))}
            </div>
          </div>
        )}

        <header className="trade-header">
          <div className="trade-breadcrumb">
            <span>トレード</span>
            <span className="crumb-divider">›</span>
            <span>{locationLabel}</span>
            <span className="crumb-divider">›</span>
            <strong>{property.name}</strong>
          </div>
          <button className="close-btn" onClick={onCancel}>街へ戻る</button>
        </header>

        <div className="trade-meta-grid">
          <div className="trade-location-card">
            <p className="trade-location-eyebrow">現在の遠征先</p>
            <h3>{locationLabel}</h3>
            <p className="trade-location-desc">{city?.description ?? 'この都市の事情を探りましょう'}</p>
            <div className="trade-tags">
              <span className="trade-tag">{property.category}</span>
              <span className="trade-tag">{property.group}</span>
              <span className="trade-tag accent">日収 +{property.income.toLocaleString()} G</span>
            </div>
          </div>
          <div className="trade-phase-track">
            {tradePhaseSteps.map((step, index) => {
              const status = index < phaseIndex ? 'completed' : index === phaseIndex ? 'current' : 'upcoming';
              return (
                <div key={step.key} className={`trade-phase-step ${status}`}>
                  <span>{step.label}</span>
                  <small>{step.hint}</small>
                </div>
              );
            })}
          </div>
        </div>

        <div className="trade-grid">
          <section className="trade-brief">
            <div className="trade-property-card">
              <div className="trade-property-head">
                <h3>{property.name}</h3>
                <span className="trade-day-chip">DAY {battle.battleDay}</span>
              </div>
              <p className="trade-property-desc">{property.description}</p>
              <ul className="trade-property-meta">
                <li><span>相場</span><strong>{property.basePrice.toLocaleString()} G</strong></li>
                <li><span>独立危険度</span><strong style={{ color: riskColor }}>{riskLabel}</strong></li>
                <li><span>所有状況</span><strong>{property.ownerId ? '他社所有' : '未所有'}</strong></li>
                <li><span>収益</span><strong>+{property.income.toLocaleString()} G / 日</strong></li>
              </ul>
            </div>

            <div className="trade-log-panel">
              <div className="trade-log-head">
                <h4>行動ログ</h4>
              </div>
              {actionLog.length === 0 ? (
                <p className="trade-log-empty">まだログがありません</p>
              ) : (
                <ul className="trade-log">
                  {actionLog.map(entry => (
                    <li key={entry.id} className={entry.tone}>
                      <span className="log-time">{entry.timestamp}</span>
                      <p>{entry.message}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="trade-engagement">
            <div className="battle-info">
              <div className="info-row">
                <div className="player-info">
                  <h3>自社</h3>
                  <p>投入資金: {playerFunds.toLocaleString()} G</p>
                  <p>加速度: {battle.playerAcceleration}</p>
                </div>
                <div className="vs">VS</div>
                <div className="opponent-info">
                  <h3>{battle.opponentCompany}</h3>
                  <p>投入資金: {opponentFunds.toLocaleString()} G</p>
                  <p>加速度: {battle.opponentAcceleration}</p>
                </div>
              </div>
            </div>

            <div className="gauge-container">
              <div className="gauge-labels">
                <span className="gauge-label-left">敵社有利</span>
                <span className="gauge-label-center">均衡</span>
                <span className="gauge-label-right">自社有利</span>
              </div>
              <div className="stripe-gauge">
                <div className="gauge-fill player-side" style={{ width: `${gaugePercentage}%` }} />
                <div className="gauge-fill opponent-side" style={{ width: `${100 - gaugePercentage}%` }} />
                <div className="gauge-indicator" style={{ left: `${gaugePercentage}%` }}>▼</div>
              </div>
              <div className="gauge-percentage">
                <span className="opponent-percent">{(100 - gaugePercentage).toFixed(1)}%</span>
                <span className="player-percent">{gaugePercentage.toFixed(1)}%</span>
              </div>
            </div>

            <div className="trade-status-card">
              <p>{message}</p>
            </div>

            <div className="command-buttons">
              <button 
                className="command-btn"
                onClick={requestFunds}
                disabled={isAnimating || !battle.isPlayerTurn}
              >
                💰 資金を要求する
              </button>
              <button 
                className="command-btn"
                onClick={requestGroupFunds}
                disabled={isAnimating || !battle.isPlayerTurn}
              >
                🔗 グループに要求
              </button>
              <button 
                className="command-btn"
                onClick={useNegotiation}
                disabled={isAnimating || !battle.isPlayerTurn}
              >
                💡 かけひきする
              </button>
              <button 
                className="command-btn"
                onClick={useOwnFunds}
                disabled={isAnimating || !battle.isPlayerTurn}
              >
                💵 自社資金を出す
              </button>
              <button 
                className="command-btn danger"
                onClick={giveUp}
                disabled={isAnimating}
              >
                🚪 トレードをやめる
              </button>
            </div>

            <div className="battle-help">
              <p>💡 ヒント: グループ資金と交渉術を組み合わせて、ゲージを自社側に寄せましょう。</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
