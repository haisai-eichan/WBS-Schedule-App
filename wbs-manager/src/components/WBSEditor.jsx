import { useState } from 'react'
import * as XLSX from 'xlsx'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './WBSEditor.css'

function WBSEditor({ project, onProjectUpdate, onBack }) {
    const [tasks, setTasks] = useState(project.tasks)
    const [currentRole, setCurrentRole] = useState('director') // director, agency, client
    const [showShareModal, setShowShareModal] = useState(false)
    const [showCommentModal, setShowCommentModal] = useState(false)
    const [showExportMenu, setShowExportMenu] = useState(false)
    const [showVersionModal, setShowVersionModal] = useState(false)
    const [selectedTask, setSelectedTask] = useState(null)
    const [newComment, setNewComment] = useState('')
    const [expandedTasks, setExpandedTasks] = useState(new Set(tasks.map(t => t.id)))

    const [versions, setVersions] = useState([])
    const [members, setMembers] = useState(project.members || ['ディレクター', 'デザイナー', 'エンジニア'])
    const [showMemberModal, setShowMemberModal] = useState(false)
    const [newMemberName, setNewMemberName] = useState('')

    const canEdit = currentRole === 'director' || currentRole === 'agency'

    // DnD sensors setup
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = (event) => {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const moveTaskInTree = (taskList) => {
            const activeIndex = taskList.findIndex(t => t.id === active.id)
            const overIndex = taskList.findIndex(t => t.id === over.id)

            if (activeIndex !== -1 && overIndex !== -1) {
                return arrayMove(taskList, activeIndex, overIndex)
            }

            return taskList.map(task => {
                if (task.children) {
                    return { ...task, children: moveTaskInTree(task.children) }
                }
                return task
            })
        }

        const newTasks = moveTaskInTree(tasks)
        if (JSON.stringify(newTasks) !== JSON.stringify(tasks)) {
            setTasks(newTasks)
            onProjectUpdate({ ...project, tasks: newTasks })
        }
    }

    // 営業日ベースで終了日を計算
    const calculateEndDate = (startDate, duration) => {
        if (!startDate || !duration || duration <= 0) {
            return ''
        }

        const start = new Date(startDate)
        let daysAdded = 0
        let current = new Date(start)

        // 営業日（月〜金）のみカウント
        while (daysAdded < duration) {
            current.setDate(current.getDate() + 1)
            const dayOfWeek = current.getDay()
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 日曜・土曜を除外
                daysAdded++
            }
        }

        return current.toISOString().split('T')[0] // YYYY-MM-DD形式
    }

    const handleTaskUpdate = (taskId, updates, parentTasks = tasks) => {
        const updateTask = (taskList) => {
            return taskList.map(task => {
                if (task.id === taskId) {
                    let updatedTask = { ...task, ...updates }

                    // 親タスクを完了にする場合、子タスクも完了にするか確認
                    if ('status' in updates && updates.status === 'completed' && task.children && task.children.length > 0) {
                        const hasIncompleteChildren = task.children.some(child => child.status !== 'completed')
                        if (hasIncompleteChildren) {
                            // setTimeoutを使用して、イベントループの次のサイクルで確認ダイアログを表示
                            setTimeout(() => {
                                const confirmed = window.confirm('このタスクの子タスクもすべて完了にしますか?')
                                if (confirmed) {
                                    // 確認した場合、子タスクも含めて更新
                                    const fullyUpdatedTasks = updateTask(taskList).map(t => {
                                        if (t.id === taskId && t.children) {
                                            return { ...t, children: markAllChildrenCompleted(t.children) }
                                        }
                                        return t
                                    })
                                    setTasks(fullyUpdatedTasks)
                                    onProjectUpdate({ ...project, tasks: fullyUpdatedTasks })
                                }
                            }, 0)
                            // 最初は親タスクのみ更新
                            return updatedTask
                        }
                    }

                    // 開始日または日数が変更された場合、終了日を自動計算
                    if ('startDate' in updates || 'duration' in updates) {
                        const newStartDate = updates.startDate !== undefined ? updates.startDate : task.startDate
                        const newDuration = updates.duration !== undefined ? updates.duration : (task.duration || 0)
                        updatedTask.endDate = calculateEndDate(newStartDate, newDuration)
                    }

                    return updatedTask
                }
                if (task.children) {
                    return { ...task, children: updateTask(task.children) }
                }
                return task
            })
        }

        const newTasks = updateTask(parentTasks)
        setTasks(newTasks)
        onProjectUpdate({ ...project, tasks: newTasks })
    }

    // 全子タスクを完了にする
    const markAllChildrenCompleted = (children) => {
        return children.map(child => ({
            ...child,
            status: 'completed',
            children: child.children ? markAllChildrenCompleted(child.children) : child.children
        }))
    }

    // スケジュール検証
    const validateSchedule = (task) => {
        if (!task.children || task.children.length === 0) {
            return { isValid: true, message: '' }
        }

        const childDates = task.children
            .filter(c => c.startDate && c.endDate)
            .map(c => ({
                start: new Date(c.startDate),
                end: new Date(c.endDate)
            }))

        if (childDates.length === 0) return { isValid: true, message: '' }

        const minChildStart = new Date(Math.min(...childDates.map(d => d.start)))
        const maxChildEnd = new Date(Math.max(...childDates.map(d => d.end)))

        const parentStart = task.startDate ? new Date(task.startDate) : null
        const parentEnd = task.endDate ? new Date(task.endDate) : null

        if (parentStart && parentStart > minChildStart) {
            return {
                isValid: false,
                message: '親タスクの開始日が子タスクより遅いです'
            }
        }

        if (parentEnd && parentEnd < maxChildEnd) {
            return {
                isValid: false,
                message: '親タスクの終了日が子タスクより早いです'
            }
        }

        return { isValid: true, message: '' }
    }

    // タスクを階層構造からフラット配列に変換
    const flattenTasks = (taskList, level = 0) => {
        let result = []
        taskList.forEach(task => {
            result.push({ ...task, level })
            if (task.children && task.children.length > 0) {
                result = result.concat(flattenTasks(task.children, level + 1))
            }
        })
        return result
    }

    // Excel形式でエクスポート
    const exportToExcel = () => {
        const flatTasks = flattenTasks(tasks)

        const data = flatTasks.map(task => ({
            'レベル': task.level,
            'タスク名': '  '.repeat(task.level) + task.name,
            'ステータス': task.status === 'completed' ? '完了' : task.status === 'inProgress' ? '進行中' : '未着手',
            '担当者': task.assignee || '',
            '開始日': task.startDate || '',
            '日数': task.duration || 0,
            '終了日': task.endDate || '',
            'コメント数': task.comments?.length || 0
        }))

        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'WBS')

        XLSX.writeFile(wb, `${project.name}_WBS.xlsx`)
        setShowExportMenu(false)
    }

    // CSV形式でエクスポート
    const exportToCSV = () => {
        const flatTasks = flattenTasks(tasks)

        const headers = ['レベル', 'タスク名', 'ステータス', '担当者', '開始日', '日数', '終了日', 'コメント数']
        const rows = flatTasks.map(task => [
            task.level,
            '  '.repeat(task.level) + task.name,
            task.status === 'completed' ? '完了' : task.status === 'inProgress' ? '進行中' : '未着手',
            task.assignee || '',
            task.startDate || '',
            task.duration || 0,
            task.endDate || '',
            task.comments?.length || 0
        ])

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n')

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `${project.name}_WBS.csv`
        link.click()
        setShowExportMenu(false)
    }

    // 親タスクを追加
    const addParentTask = () => {
        const newTask = {
            id: Date.now().toString(),
            name: '新規タスク',
            status: 'pending',
            assignee: '',
            startDate: '',
            duration: 0,
            endDate: '',
            comments: [],
            children: []
        }
        const newTasks = [...tasks, newTask]
        setTasks(newTasks)
        onProjectUpdate({ ...project, tasks: newTasks })
    }

    // 子タスクを追加
    const addChildTask = (parentId) => {
        const newChild = {
            id: Date.now().toString(),
            name: '新規子タスク',
            status: 'pending',
            assignee: '',
            startDate: '',
            duration: 0,
            endDate: '',
            comments: []
        }

        const updateTask = (taskList) => {
            return taskList.map(task => {
                if (task.id === parentId) {
                    return { ...task, children: [...(task.children || []), newChild] }
                }
                if (task.children) {
                    return { ...task, children: updateTask(task.children) }
                }
                return task
            })
        }

        const newTasks = updateTask(tasks)
        setTasks(newTasks)
        onProjectUpdate({ ...project, tasks: newTasks })

        // 親タスクを展開
        if (!expandedTasks.has(parentId)) {
            toggleTaskExpand(parentId)
        }
    }

    // タスクを削除
    const deleteTask = (taskId) => {
        // setTimeoutを使用して、イベントループの次のサイクルで確認ダイアログを表示
        setTimeout(() => {
            if (!window.confirm('このタスクを削除してもよろしいですか？')) return

            const removeTask = (taskList) => {
                return taskList.filter(task => {
                    if (task.id === taskId) return false
                    if (task.children) {
                        task.children = removeTask(task.children)
                    }
                    return true
                })
            }

            const newTasks = removeTask([...tasks])
            setTasks(newTasks)
            onProjectUpdate({ ...project, tasks: newTasks })
        }, 0)
    }

    // テンプレート定義（リセット用）
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

    // プロジェクトをリセット
    const resetProject = () => {
        setTimeout(() => {
            if (!window.confirm('プロジェクトを初期状態にリセットしますか？この操作は取り消せません。')) return
            const initialTasks = getWebProductionTemplate()
            setTasks(initialTasks)
            onProjectUpdate({ ...project, tasks: initialTasks })
        }, 0)
    }

    // バージョン保存
    const saveVersion = () => {
        const timestamp = new Date().toLocaleString()
        const newVersion = {
            id: Date.now().toString(),
            name: `v${versions.length + 1} - ${timestamp}`,
            timestamp: timestamp,
            tasks: JSON.parse(JSON.stringify(tasks))
        }
        setVersions([newVersion, ...versions])
        alert('現在の状態をバージョンとして保存しました。')
    }

    // バージョン復元
    const restoreVersion = (version) => {
        setTimeout(() => {
            if (!window.confirm(`バージョン「${version.name}」の状態に復元しますか？現在の変更は失われます。`)) return
            setTasks(JSON.parse(JSON.stringify(version.tasks)))
            onProjectUpdate({ ...project, tasks: version.tasks })
            setShowVersionModal(false)
        }, 0)
    }

    // タスク移動（ボタン用）
    const moveTask = (taskId, direction) => {
        const moveInList = (list) => {
            const index = list.findIndex(t => t.id === taskId)
            if (index !== -1) {
                if (direction === 'up' && index > 0) {
                    const newList = [...list]
                    const temp = newList[index]
                    newList[index] = newList[index - 1]
                    newList[index - 1] = temp
                    return newList
                }
                if (direction === 'down' && index < list.length - 1) {
                    const newList = [...list]
                    const temp = newList[index]
                    newList[index] = newList[index + 1]
                    newList[index + 1] = temp
                    return newList
                }
                return list
            }

            return list.map(task => {
                if (task.children) {
                    return { ...task, children: moveInList(task.children) }
                }
                return task
            })
        }

        const newTasks = moveInList(tasks)
        if (JSON.stringify(newTasks) !== JSON.stringify(tasks)) {
            setTasks(newTasks)
            onProjectUpdate({ ...project, tasks: newTasks })
        }
    }

    // プロジェクト情報の更新
    const handleProjectInfoUpdate = (updates) => {
        onProjectUpdate({ ...project, ...updates })
    }

    // メンバー追加
    const addMember = () => {
        if (!newMemberName.trim()) return
        if (members.includes(newMemberName.trim())) {
            alert('このメンバーは既に存在します')
            return
        }
        const newMembers = [...members, newMemberName.trim()]
        setMembers(newMembers)
        onProjectUpdate({ ...project, members: newMembers })
        setNewMemberName('')
    }

    // メンバー削除
    const removeMember = (member) => {
        if (!window.confirm(`${member}を削除してもよろしいですか？`)) return
        const newMembers = members.filter(m => m !== member)
        setMembers(newMembers)
        onProjectUpdate({ ...project, members: newMembers })
    }

    // 自動計算された終了日（全タスクの中で最も遅い日）
    const getCalculatedEndDate = () => {
        const allEndDates = []
        const collectDates = (taskList) => {
            taskList.forEach(t => {
                if (t.endDate) allEndDates.push(new Date(t.endDate))
                if (t.children) collectDates(t.children)
            })
        }
        collectDates(tasks)
        if (allEndDates.length === 0) return null
        return new Date(Math.max(...allEndDates)).toISOString().split('T')[0]
    }

    const handleAddComment = () => {
        if (!newComment.trim() || !selectedTask) return

        const comment = {
            id: Date.now().toString(),
            author: currentRole === 'director' ? 'ディレクター' : currentRole === 'agency' ? '代理店' : 'クライアント',
            content: newComment,
            timestamp: new Date().toISOString(),
            role: currentRole
        }

        const updatedComments = [...(selectedTask.comments || []), comment]
        handleTaskUpdate(selectedTask.id, { comments: updatedComments })
        setNewComment('')
    }

    const openCommentModal = (task) => {
        setSelectedTask(task)
        setShowCommentModal(true)
    }

    const closeCommentModal = () => {
        setShowCommentModal(false)
        setSelectedTask(null)
        setNewComment('')
    }

    const toggleTaskExpand = (taskId) => {
        const newExpanded = new Set(expandedTasks)
        if (newExpanded.has(taskId)) {
            newExpanded.delete(taskId)
        } else {
            newExpanded.add(taskId)
        }
        setExpandedTasks(newExpanded)
    }

    const calculateProgress = () => {
        const allTasks = []
        const collectTasks = (taskList) => {
            taskList.forEach(task => {
                allTasks.push(task)
                if (task.children) collectTasks(task.children)
            })
        }
        collectTasks(tasks)

        const completed = allTasks.filter(t => t.status === 'completed').length
        return allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0
    }

    const formatRelativeTime = (timestamp) => {
        const now = new Date()
        const then = new Date(timestamp)
        const diffMs = now - then
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'たった今'
        if (diffMins < 60) return `${diffMins}分前`
        if (diffHours < 24) return `${diffHours}時間前`
        return `${diffDays}日前`
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <div className="wbs-editor">
                <div className="editor-header">
                    <div className="editor-header-left">
                        <div className="project-info-edit">
                            <input
                                type="text"
                                className="project-name-input"
                                value={project.name}
                                onChange={(e) => handleProjectInfoUpdate({ name: e.target.value })}
                                placeholder="プロジェクト名"
                            />
                            <div className="project-meta-row">
                                <div className="meta-item">
                                    <label>管理者:</label>
                                    <input
                                        type="text"
                                        className="meta-input"
                                        value={project.manager || ''}
                                        onChange={(e) => handleProjectInfoUpdate({ manager: e.target.value })}
                                        placeholder="管理者名"
                                    />
                                </div>
                                <div className="meta-item">
                                    <label>終了予定:</label>
                                    <div className="date-display">
                                        <input
                                            type="date"
                                            className="meta-input"
                                            value={project.scheduledEndDate || ''}
                                            onChange={(e) => handleProjectInfoUpdate({ scheduledEndDate: e.target.value })}
                                        />
                                        {!project.scheduledEndDate && getCalculatedEndDate() && (
                                            <span className="calculated-date">（仮: {getCalculatedEndDate()}）</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="editor-header-right">
                        <div className="header-controls-top">
                            <div className="role-switcher">
                                <label>表示モード:</label>
                                <select value={currentRole} onChange={(e) => setCurrentRole(e.target.value)}>
                                    <option value="director">ディレクター（編集可）</option>
                                    <option value="agency">代理店（編集可）</option>
                                    <option value="client">クライアント（閲覧のみ）</option>
                                </select>
                            </div>
                        </div>

                        <div className="header-controls-bottom">
                            <div className="button-group data-group">
                                <div className="export-dropdown">
                                    <button
                                        className="btn-primary btn-compact"
                                        onClick={() => setShowExportMenu(!showExportMenu)}
                                    >
                                        📥 エクスポート
                                    </button>
                                    {showExportMenu && (
                                        <div className="export-menu">
                                            <button onClick={exportToExcel}>Excel形式 (.xlsx)</button>
                                            <button onClick={exportToCSV}>CSV形式</button>
                                        </div>
                                    )}
                                </div>

                                <button className="btn-primary btn-compact" onClick={saveVersion}>
                                    💾 保存
                                </button>

                                <button className="btn-primary btn-compact" onClick={() => setShowVersionModal(true)}>
                                    📜 履歴
                                </button>

                                <button className="btn-danger btn-compact" onClick={resetProject}>
                                    🔄 リセット
                                </button>
                            </div>

                            <div className="button-group project-group">
                                <button className="btn-primary btn-compact" onClick={() => setShowMemberModal(true)}>
                                    👥 メンバー
                                </button>

                                <button className="btn-primary btn-compact" onClick={() => setShowShareModal(true)}>
                                    🔗 共有
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* メンバー管理モーダル */}
                {showMemberModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h3>メンバー管理</h3>
                                <button className="modal-close" onClick={() => setShowMemberModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="member-input-group">
                                    <input
                                        type="text"
                                        value={newMemberName}
                                        onChange={(e) => setNewMemberName(e.target.value)}
                                        placeholder="新しいメンバー名"
                                        className="input"
                                    />
                                    <button className="btn-primary" onClick={addMember}>追加</button>
                                </div>
                                <div className="member-list">
                                    {members.map(member => (
                                        <div key={member} className="member-item">
                                            <span>{member}</span>
                                            <button
                                                className="btn-danger btn-sm"
                                                onClick={() => removeMember(member)}
                                            >
                                                削除
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-secondary" onClick={() => setShowMemberModal(false)}>閉じる</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* バージョン履歴モーダル */}
                {showVersionModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3>バージョン履歴</h3>
                            <div className="version-list">
                                {versions.length === 0 ? (
                                    <p>保存されたバージョンはありません。</p>
                                ) : (
                                    versions.map(v => (
                                        <div key={v.id} className="version-item">
                                            <div className="version-info">
                                                <span className="version-name">{v.name}</span>
                                                <span className="version-tasks">{v.tasks.length} タスク</span>
                                            </div>
                                            <button
                                                className="btn-primary btn-sm"
                                                onClick={() => restoreVersion(v)}
                                            >
                                                復元
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="modal-actions">
                                <button className="btn-secondary" onClick={() => setShowVersionModal(false)}>閉じる</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="progress-section">
                    <div className="progress-info">
                        <span className="progress-label">プロジェクト進捗</span>
                        <span className="progress-percentage">{calculateProgress()}%</span>
                    </div>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${calculateProgress()}%` }}
                        />
                    </div>
                </div>

                <div className="wbs-container">
                    <div className="wbs-header">
                        <div className="header-cell main-cell">タスク名</div>
                        <div className="header-cell status-cell">ステータス</div>
                        <div className="header-cell assignee-cell">担当者</div>
                        <div className="header-cell date-cell">開始日</div>
                        <div className="header-cell duration-cell">日数</div>
                        <div className="header-cell date-cell">終了日</div>
                    </div>

                    <div className="tasks-list">
                        <SortableContext
                            items={tasks.map(t => t.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {tasks.map(task => (
                                <TaskRow
                                    key={task.id}
                                    task={task}
                                    members={members}
                                    expandedTasks={expandedTasks}
                                    toggleTaskExpand={toggleTaskExpand}
                                    canEdit={canEdit}
                                    handleTaskUpdate={handleTaskUpdate}
                                    validateSchedule={validateSchedule}
                                    moveTask={moveTask}
                                    openCommentModal={openCommentModal}
                                    addChildTask={addChildTask}
                                    deleteTask={deleteTask}
                                />
                            ))}
                        </SortableContext>
                        {canEdit && (
                            <button className="add-parent-task-button" onClick={addParentTask}>
                                ➕ 新しい親タスクを追加
                            </button>
                        )}
                    </div>
                </div>

                {/* 共有モーダル */}
                {showShareModal && (
                    <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>共有設定</h3>
                                <button className="modal-close" onClick={() => setShowShareModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>共有リンク（閲覧専用）</label>
                                    <div className="share-link-container">
                                        <input
                                            type="text"
                                            className="input"
                                            value={`https://wbs-manager.example.com/share/${project.id}`}
                                            readOnly
                                        />
                                        <button className="btn-primary" onClick={() => {
                                            navigator.clipboard.writeText(`https://wbs-manager.example.com/share/${project.id}`)
                                            alert('リンクをコピーしました！')
                                        }}>
                                            コピー
                                        </button>
                                    </div>
                                </div>

                                <div className="share-permissions">
                                    <h4>権限設定</h4>
                                    <div className="permission-item">
                                        <label className="checkbox-label">
                                            <input type="checkbox" defaultChecked />
                                            <span>代理店による編集を許可</span>
                                        </label>
                                    </div>
                                    <div className="permission-item">
                                        <label className="checkbox-label">
                                            <input type="checkbox" defaultChecked />
                                            <span>クライアントによるコメント追加を許可</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-secondary" onClick={() => setShowShareModal(false)}>
                                    閉じる
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* コメントモーダル */}
                {/* コメントモーダル */}
                {showCommentModal && selectedTask && (
                    <div className="modal-overlay" onClick={closeCommentModal}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>💬 コメント: {selectedTask.name}</h3>
                                <button className="modal-close" onClick={closeCommentModal}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="comments-list">
                                    {selectedTask.comments && selectedTask.comments.length > 0 ? (
                                        selectedTask.comments.map(comment => (
                                            <div key={comment.id} className="comment-item">
                                                <div className="comment-header">
                                                    <span className="comment-author">
                                                        {comment.role === 'director' && '👤'}
                                                        {comment.role === 'agency' && '🏢'}
                                                        {comment.role === 'client' && '👥'}
                                                        {' '}
                                                        {comment.author}
                                                    </span>
                                                    <span className="comment-time">{formatRelativeTime(comment.timestamp)}</span>
                                                </div>
                                                <div className="comment-content">{comment.content}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-comments">
                                            <p>まだコメントがありません</p>
                                        </div>
                                    )}
                                </div>

                                <div className="comment-form">
                                    <textarea
                                        className="comment-textarea"
                                        placeholder="コメントを入力..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-secondary" onClick={closeCommentModal}>
                                    キャンセル
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim()}
                                >
                                    コメント追加
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DndContext>
    )
}
const getStatusColor = (status) => {
    switch (status) {
        case 'completed': return 'var(--color-accent-success)'
        case 'inProgress': return 'var(--color-accent-primary)'
        case 'pending': return 'var(--color-text-muted)'
        default: return 'var(--color-text-muted)'
    }
}

const cycleStatus = (currentStatus) => {
    const statuses = ['pending', 'inProgress', 'completed']
    const currentIndex = statuses.indexOf(currentStatus)
    return statuses[(currentIndex + 1) % statuses.length]
}

// 担当者名から一貫した色を生成
const getAssigneeColor = (assignee) => {
    if (!assignee) return 'transparent'

    // 文字列からハッシュ値を生成
    let hash = 0
    for (let i = 0; i < assignee.length; i++) {
        hash = assignee.charCodeAt(i) + ((hash << 5) - hash)
    }

    // ハッシュ値から色相を計算（0-360度）
    const hue = Math.abs(hash % 360)

    // より鮮やかで見やすい色に設定（彩度と明度を上げて、透明度を下げる）
    return `hsla(${hue}, 75%, 55%, 0.35)`
}

const TaskRow = ({
    task,
    level = 0,
    members,
    expandedTasks,
    toggleTaskExpand,
    canEdit,
    handleTaskUpdate,
    validateSchedule,
    moveTask,
    openCommentModal,
    addChildTask,
    deleteTask
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    }

    const hasChildren = task.children && task.children.length > 0
    const isExpanded = expandedTasks.has(task.id)
    const commentCount = task.comments?.length || 0
    const scheduleValidation = validateSchedule(task)

    return (
        <>
            <div ref={setNodeRef} style={style} className={`task-row level-${level} ${task.status === 'completed' ? 'task-row-completed' : ''}`}>
                <div className="task-main">
                    {canEdit && (
                        <div className="drag-handle" {...attributes} {...listeners}>
                            ⋮⋮
                        </div>
                    )}
                    {hasChildren && (
                        <button
                            className="expand-button"
                            onClick={() => toggleTaskExpand(task.id)}
                        >
                            {isExpanded ? '▼' : '▶'}
                        </button>
                    )}
                    {!hasChildren && <div className="expand-spacer" />}

                    <div
                        className="status-indicator"
                        style={{ background: getStatusColor(task.status) }}
                        onClick={() => canEdit && handleTaskUpdate(task.id, { status: cycleStatus(task.status) })}
                        title={canEdit ? 'クリックでステータス変更' : ''}
                    />

                    <input
                        type="text"
                        className="task-name-input"
                        value={task.name}
                        onChange={(e) => canEdit && handleTaskUpdate(task.id, { name: e.target.value })}
                        readOnly={!canEdit}
                    />

                    {!scheduleValidation.isValid && (
                        <span className="schedule-warning" title={scheduleValidation.message}>
                            ⚠️
                        </span>
                    )}

                    <div className="task-actions">
                        {canEdit && (
                            <div className="move-buttons">
                                <button
                                    className="action-button move-button"
                                    onClick={() => moveTask(task.id, 'up')}
                                    title="上に移動"
                                >
                                    ↑
                                </button>
                                <button
                                    className="action-button move-button"
                                    onClick={() => moveTask(task.id, 'down')}
                                    title="下に移動"
                                >
                                    ↓
                                </button>
                            </div>
                        )}

                        <button
                            className="comment-button"
                            onClick={() => openCommentModal(task)}
                            title="コメントを表示"
                        >
                            💬
                            {commentCount > 0 && <span className="comment-badge">{commentCount}</span>}
                        </button>

                        {canEdit && (
                            <>
                                {hasChildren || level === 0 ? (
                                    <button
                                        className="action-button add-child-button"
                                        onClick={() => addChildTask(task.id)}
                                        title="子タスクを追加"
                                    >
                                        ➕
                                    </button>
                                ) : null}

                                <button
                                    className="action-button delete-button"
                                    onClick={() => deleteTask(task.id)}
                                    title="タスクを削除"
                                >
                                    🗑️
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="task-details">
                    <select
                        className="task-select"
                        value={task.status}
                        onChange={(e) => canEdit && handleTaskUpdate(task.id, { status: e.target.value })}
                        disabled={!canEdit}
                    >
                        <option value="pending">未着手</option>
                        <option value="inProgress">進行中</option>
                        <option value="completed">完了</option>
                    </select>

                    <select
                        className="task-select assignee-select"
                        value={task.assignee}
                        onChange={(e) => canEdit && handleTaskUpdate(task.id, { assignee: e.target.value })}
                        disabled={!canEdit}
                        style={{ backgroundColor: getAssigneeColor(task.assignee) }}
                    >
                        <option value="">未定</option>
                        {members && members.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>

                    <input
                        type="date"
                        className="task-input"
                        value={task.startDate}
                        onChange={(e) => canEdit && handleTaskUpdate(task.id, { startDate: e.target.value })}
                        readOnly={!canEdit}
                    />

                    <input
                        type="number"
                        className="task-input task-input-short"
                        placeholder="0"
                        min="0"
                        value={task.duration || 0}
                        onChange={(e) => canEdit && handleTaskUpdate(task.id, { duration: parseInt(e.target.value) || 0 })}
                        readOnly={!canEdit}
                    />

                    <input
                        type="date"
                        className="task-input task-input-readonly"
                        value={task.endDate}
                        readOnly
                        title="開始日＋日数で自動計算"
                    />
                </div>
            </div>

            {hasChildren && isExpanded && (
                <SortableContext
                    items={task.children.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {task.children.map(child => (
                        <TaskRow
                            key={child.id}
                            task={child}
                            level={level + 1}
                            members={members}
                            expandedTasks={expandedTasks}
                            toggleTaskExpand={toggleTaskExpand}
                            canEdit={canEdit}
                            handleTaskUpdate={handleTaskUpdate}
                            validateSchedule={validateSchedule}
                            moveTask={moveTask}
                            openCommentModal={openCommentModal}
                            addChildTask={addChildTask}
                            deleteTask={deleteTask}
                        />
                    ))}
                </SortableContext>
            )}
        </>
    )
}

export default WBSEditor
