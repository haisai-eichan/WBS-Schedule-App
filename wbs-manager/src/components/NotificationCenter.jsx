import { useState } from 'react'
import './NotificationCenter.css'

function NotificationCenter() {
    const [showPanel, setShowPanel] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [settings, setSettings] = useState({
        email: true,
        slack: false,
        system: true,
        taskCompleted: true,
        deadlineApproaching: true,
        newComment: true
    })

    const mockNotifications = [
        {
            id: 1,
            type: 'taskCompleted',
            title: 'タスクが完了しました',
            message: '「デザインカンプ作成」が完了しました',
            time: '5分前',
            read: false
        },
        {
            id: 2,
            type: 'deadlineApproaching',
            title: '期限が近づいています',
            message: '「ワイヤーフレーム作成」の期限は明日です',
            time: '2時間前',
            read: false
        },
        {
            id: 3,
            type: 'newComment',
            title: '新しいコメント',
            message: 'クライアントがコメントを追加しました',
            time: '1日前',
            read: true
        }
    ]

    const unreadCount = mockNotifications.filter(n => !n.read).length

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'taskCompleted': return '✅'
            case 'deadlineApproaching': return '⏰'
            case 'newComment': return '💬'
            default: return '📢'
        }
    }

    return (
        <div className="notification-center">
            <button
                className="notification-button"
                onClick={() => setShowPanel(!showPanel)}
            >
                🔔
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>

            {showPanel && (
                <div className="notification-panel">
                    <div className="notification-panel-header">
                        <h3>通知</h3>
                        <button
                            className="settings-icon-button"
                            onClick={() => setShowSettings(!showSettings)}
                            title="通知設定"
                        >
                            ⚙️
                        </button>
                    </div>

                    {!showSettings ? (
                        <div className="notification-list">
                            {mockNotifications.length === 0 ? (
                                <div className="empty-notifications">
                                    <p>通知はありません</p>
                                </div>
                            ) : (
                                mockNotifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                                    >
                                        <div className="notification-icon">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="notification-content">
                                            <div className="notification-title">{notification.title}</div>
                                            <div className="notification-message">{notification.message}</div>
                                            <div className="notification-time">{notification.time}</div>
                                        </div>
                                        {!notification.read && <div className="unread-dot" />}
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="notification-settings">
                            <h4>通知チャンネル</h4>
                            <div className="settings-group">
                                <label className="setting-item">
                                    <input
                                        type="checkbox"
                                        checked={settings.email}
                                        onChange={(e) => setSettings({ ...settings, email: e.target.checked })}
                                    />
                                    <div className="setting-info">
                                        <span className="setting-label">📧 メール通知</span>
                                        <span className="setting-desc">登録メールアドレスに通知を送信</span>
                                    </div>
                                </label>

                                <label className="setting-item">
                                    <input
                                        type="checkbox"
                                        checked={settings.slack}
                                        onChange={(e) => setSettings({ ...settings, slack: e.target.checked })}
                                    />
                                    <div className="setting-info">
                                        <span className="setting-label">💬 Slack通知</span>
                                        <span className="setting-desc">Slackチャンネルに通知を送信</span>
                                    </div>
                                </label>

                                <label className="setting-item">
                                    <input
                                        type="checkbox"
                                        checked={settings.system}
                                        onChange={(e) => setSettings({ ...settings, system: e.target.checked })}
                                    />
                                    <div className="setting-info">
                                        <span className="setting-label">🔔 システム通知</span>
                                        <span className="setting-desc">ブラウザのプッシュ通知を送信</span>
                                    </div>
                                </label>
                            </div>

                            <h4>通知トリガー</h4>
                            <div className="settings-group">
                                <label className="setting-item">
                                    <input
                                        type="checkbox"
                                        checked={settings.taskCompleted}
                                        onChange={(e) => setSettings({ ...settings, taskCompleted: e.target.checked })}
                                    />
                                    <div className="setting-info">
                                        <span className="setting-label">タスク完了</span>
                                        <span className="setting-desc">タスクが完了した時</span>
                                    </div>
                                </label>

                                <label className="setting-item">
                                    <input
                                        type="checkbox"
                                        checked={settings.deadlineApproaching}
                                        onChange={(e) => setSettings({ ...settings, deadlineApproaching: e.target.checked })}
                                    />
                                    <div className="setting-info">
                                        <span className="setting-label">期限接近</span>
                                        <span className="setting-desc">期限が24時間以内に迫った時</span>
                                    </div>
                                </label>

                                <label className="setting-item">
                                    <input
                                        type="checkbox"
                                        checked={settings.newComment}
                                        onChange={(e) => setSettings({ ...settings, newComment: e.target.checked })}
                                    />
                                    <div className="setting-info">
                                        <span className="setting-label">新規コメント</span>
                                        <span className="setting-desc">新しいコメントが追加された時</span>
                                    </div>
                                </label>
                            </div>

                            <button
                                className="btn-primary full-width"
                                onClick={() => {
                                    alert('通知設定を保存しました！')
                                    setShowSettings(false)
                                }}
                            >
                                設定を保存
                            </button>
                        </div>
                    )}
                </div>
            )}

            {showPanel && (
                <div
                    className="notification-overlay"
                    onClick={() => setShowPanel(false)}
                />
            )}
        </div>
    )
}

export default NotificationCenter
