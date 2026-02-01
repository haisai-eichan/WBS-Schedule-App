import { useState } from 'react'
import './Dashboard.css'

function Dashboard({ projects, onProjectSelect, onCreateProject }) {
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [newProjectName, setNewProjectName] = useState('')
    const [useTemplate, setUseTemplate] = useState(true)

    const handleCreateProject = () => {
        if (!newProjectName.trim()) return

        const newProject = {
            id: Date.now().toString(),
            name: newProjectName,
            createdAt: new Date().toISOString(),
            tasks: useTemplate ? getWebProductionTemplate() : []
        }

        onCreateProject(newProject)
        setShowCreateModal(false)
        setNewProjectName('')
    }

    const getWebProductionTemplate = () => {
        return [
            {
                id: '1',
                name: '要件定義',
                status: 'pending',
                assignee: '',
                startDate: '',
                duration: 0,
                endDate: '',
                comments: [],
                children: [
                    { id: '1-1', name: 'クライアントヒアリング', status: 'pending', assignee: '', startDate: '', duration: 0, endDate: '', comments: [] },
                    { id: '1-2', name: '要件定義書作成', status: 'pending', assignee: '', startDate: '', duration: 0, endDate: '', comments: [] },
                    { id: '1-3', name: 'サイトマップ作成', status: 'pending', assignee: '', startDate: '', duration: 0, endDate: '', comments: [] }
                ]
            },
            {
                id: '2',
                name: '設計・デザイン',
                status: 'pending',
                assignee: '',
                startDate: '',
                duration: 0,
                endDate: '',
                comments: [],
                children: [
                    { id: '2-1', name: 'ワイヤーフレーム作成', status: 'pending', assignee: '', startDate: '', duration: 0, endDate: '', comments: [] },
                    { id: '2-2', name: 'デザインカンプ作成', status: 'pending', assignee: '', startDate: '', duration: 0, endDate: '', comments: [] },
                    { id: '2-3', name: 'デザインレビュー', status: 'pending', assignee: '', startDate: '', duration: 0, endDate: '', comments: [] }
                ]
            },
            {
                id: '3',
                name: '実装',
                status: 'pending',
                assignee: '',
                startDate: '',
                duration: 0,
                endDate: '',
                comments: [],
                children: [
                    { id: '3-1', name: 'フロントエンド実装', status: 'pending', assignee: '', startDate: '', duration: 0, endDate: '', comments: [] },
                    { id: '3-2', name: 'バックエンド実装', status: 'pending', assignee: '', startDate: '', duration: 0, endDate: '', comments: [] },
                    { id: '3-3', name: 'CMS設定', status: 'pending', assignee: '', startDate: '', duration: 0, endDate: '', comments: [] }
                ]
            },
            {
                id: '4',
                name: 'テスト',
                status: 'pending',
                assignee: '',
                startDate: '',
                duration: 0,
                endDate: '',
                comments: [],
                children: [
                    { id: '4-1', name: '単体テスト', status: 'pending', assignee: '', startDate: '', duration: 0, endDate: '', comments: [] },
                    { id: '4-2', name: 'クロスブラウザテスト', status: 'pending', assignee: '', startDate: '', duration: 0, endDate: '', comments: [] },
                    { id: '4-3', name: 'ユーザーテスト', status: 'pending', assignee: '', startDate: '', duration: 0, endDate: '', comments: [] }
                ]
            },
            {
                id: '5',
                name: '公開',
                status: 'pending',
                assignee: '',
                startDate: '',
                duration: 0,
                endDate: '',
                comments: [],
                children: [
                    { id: '5-1', name: '本番環境構築', status: 'pending', assignee: '', startDate: '', duration: 0, endDate: '', comments: [] },
                    { id: '5-2', name: 'デプロイ', status: 'pending', assignee: '', startDate: '', duration: 0, endDate: '', comments: [] },
                    { id: '5-3', name: '公開確認', status: 'pending', assignee: '', startDate: '', duration: 0, endDate: '', comments: [] }
                ]
            }
        ]
    }

    const calculateProgress = (project) => {
        const allTasks = []
        const collectTasks = (tasks) => {
            tasks.forEach(task => {
                allTasks.push(task)
                if (task.children) collectTasks(task.children)
            })
        }
        collectTasks(project.tasks)

        const completed = allTasks.filter(t => t.status === 'completed').length
        return allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0
    }

    const calculateProjectEndDate = (project) => {
        // プロジェクトに設定された終了日があればそれを使用
        if (project.scheduledEndDate) {
            return { date: project.scheduledEndDate, isEstimated: false }
        }

        // なければタスクから自動計算
        const allEndDates = []
        const collectDates = (taskList) => {
            taskList.forEach(t => {
                if (t.endDate) allEndDates.push(new Date(t.endDate))
                if (t.children) collectDates(t.children)
            })
        }
        collectDates(project.tasks)

        if (allEndDates.length === 0) return null

        const latestDate = new Date(Math.max(...allEndDates)).toISOString().split('T')[0]
        return { date: latestDate, isEstimated: true }
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div>
                    <h2>プロジェクト一覧</h2>
                    <p className="dashboard-subtitle">進行中のWEB制作プロジェクトを管理</p>
                </div>
                <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                    <span className="btn-icon">+</span>
                    新規プロジェクト
                </button>
            </div>

            <div className="project-grid">
                {projects.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <h3>プロジェクトがありません</h3>
                        <p>「新規プロジェクト」ボタンからプロジェクトを作成してください</p>
                    </div>
                ) : (
                    projects.map(project => (
                        <div
                            key={project.id}
                            className="project-card"
                            onClick={() => onProjectSelect(project)}
                        >
                            <div className="project-card-header">
                                <h3>{project.name}</h3>
                                <span className="project-progress-badge">{calculateProgress(project)}%</span>
                            </div>
                            <div className="project-meta">
                                {project.manager && (
                                    <span className="meta-item">👤 {project.manager}</span>
                                )}
                                <span className="meta-item">📅 作成: {new Date(project.createdAt).toLocaleDateString('ja-JP')}</span>
                                {(() => {
                                    const endDateInfo = calculateProjectEndDate(project)
                                    if (endDateInfo) {
                                        return (
                                            <span className="meta-item">
                                                🏁 終了{endDateInfo.isEstimated && '(仮)'}: {new Date(endDateInfo.date).toLocaleDateString('ja-JP')}
                                            </span>
                                        )
                                    }
                                })()}
                                <span className="meta-item">📝 タスク: {project.tasks.length}</span>
                            </div>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${calculateProgress(project)}%` }}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>新規プロジェクト作成</h3>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>プロジェクト名</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="例: 株式会社サンプル コーポレートサイト"
                                    value={newProjectName}
                                    onChange={e => setNewProjectName(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handleCreateProject()}
                                />
                            </div>
                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={useTemplate}
                                        onChange={e => setUseTemplate(e.target.checked)}
                                    />
                                    <span>標準WEB制作テンプレートを使用</span>
                                </label>
                                {useTemplate && (
                                    <p className="form-hint">要件定義、設計、実装、テスト、公開のフェーズが自動設定されます</p>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                                キャンセル
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleCreateProject}
                                disabled={!newProjectName.trim()}
                            >
                                作成
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Dashboard
