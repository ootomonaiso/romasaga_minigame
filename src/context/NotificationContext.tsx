import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type NotificationVariant = 'success' | 'error' | 'info' | 'warning'

interface Notification {
  id: number
  message: string
  variant: NotificationVariant
}

interface NotificationContextValue {
  notify: (variant: NotificationVariant, message: string) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, [])

  const notify = useCallback((variant: NotificationVariant, message: string) => {
    const id = Date.now()
    setNotifications((prev) => [...prev, { id, message, variant }])

    setTimeout(() => removeNotification(id), 3200)
  }, [removeNotification])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="toast-container">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`toast ${notification.variant}`}
            onClick={() => removeNotification(notification.id)}
          >
            <span className="toast-icon" aria-hidden>
              {getToastIcon(notification.variant)}
            </span>
            <p>{notification.message}</p>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used inside NotificationProvider')
  return context
}

const getToastIcon = (variant: NotificationVariant) => {
  switch (variant) {
    case 'success':
      return '✨'
    case 'error':
      return '⚠️'
    case 'warning':
      return '⚡'
    default:
      return '💬'
  }
}
