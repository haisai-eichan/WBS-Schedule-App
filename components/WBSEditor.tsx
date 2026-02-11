'use client';

import { useState, useRef, useEffect } from 'react';
import { Project } from '@/lib/storage';
import { WBSTask } from '@/lib/wbsTemplates';
import { calculateSchedule, deleteTask, moveTaskInSection, moveSection } from '@/lib/scheduleCalculator';
import { createNewTask, createNewSectionName } from '@/lib/taskHelpers';
import StatusBadge from './StatusBadge';
import ConfirmModal from './ConfirmModal';
import styles from './WBSEditor.module.css';

interface Props {
    project: Project;
    onUpdate: (project: Project) => void;
    readOnly?: boolean;
    role?: 'Director' | 'Agency' | 'Client';
}

export default function WBSEditor({ project, onUpdate, readOnly = false, role = 'Director' }: Props) {
    const [tasks, setTasks] = useState<WBSTask[]>(project.tasks);
    const [visibleColumns, setVisibleColumns] = useState({
        completed: true,
        actions: true,
        category: true,
        assignee: true,
        estimate: true,
        type: true,
        status: true,
        startDate: true,
        endDate: true,
        countdown: true,
        outsourcing: role === 'Director',
        cost: role === 'Director'
    });
    const [showColumnToggle, setShowColumnToggle] = useState(false);
    const columnToggleRef = useRef<HTMLDivElement>(null);

    // Confirm Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        message: '',
        onConfirm: () => { },
    });

    // Close column toggle when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (columnToggleRef.current && !columnToggleRef.current.contains(event.target as Node)) {
                setShowColumnToggle(false);
            }
        };

        if (showColumnToggle) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showColumnToggle]);

    const toggleColumn = (col: keyof typeof visibleColumns) => {
        setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
    };

    const formatDateShort = (dateStr: string) => {
        if (!dateStr) return '-';
        const parts = dateStr.split('-');
        if (parts.length < 3) return dateStr;
        return `${parts[1]}/${parts[2]}`;
    };

    const recalculateAndUpdate = (newTasks: WBSTask[]) => {
        const recalculatedTasks = calculateSchedule(
            newTasks,
            new Date(project.startDate),
            new Date(project.deliveryDate),
            new Date(project.dueDate),
            project.customHolidays || [],
            new Date()
        );
        setTasks(recalculatedTasks);
        onUpdate({ ...project, tasks: recalculatedTasks });
    };

    const handleTaskChange = (id: string, field: keyof WBSTask, value: any) => {
        if (readOnly) return;
        const newTasks = tasks.map(t => {
            if (t.id === id) {
                // completed がオンになったらステータスを Done に、オフなら In Progress に
                if (field === 'completed') {
                    return { ...t, completed: value, status: (value ? 'Done' : 'In Progress') as WBSTask['status'] };
                }
                // ステータスが Done になったら completed をオンに
                if (field === 'status') {
                    return { ...t, status: value as WBSTask['status'], completed: value === 'Done' };
                }
                return { ...t, [field]: value };
            }
            return t;
        });
        setTasks(newTasks);
        onUpdate({ ...project, tasks: newTasks });
    };

    const handleToggleSection = (sectionName: string, completed: boolean) => {
        if (readOnly) return;
        const newTasks = tasks.map(t =>
            t.section === sectionName
                ? { ...t, completed, status: (completed ? 'Done' : (t.status === 'Done' ? 'In Progress' : t.status)) as WBSTask['status'] }
                : t
        );
        setTasks(newTasks);
        onUpdate({ ...project, tasks: newTasks });
    };

    const handleEstimateChange = (id: string, field: 'estimate_days' | 'estimate_hours', value: number) => {
        if (readOnly) return;
        const newTasks = tasks.map(t => t.id === id ? { ...t, [field]: value } : t);
        recalculateAndUpdate(newTasks);
    };

    const handleAddTask = (section: string) => {
        if (readOnly) return;
        const sectionTasks = tasks.filter(t => t.section === section);
        const lastTaskIndex = tasks.findIndex(t => t.id === sectionTasks[sectionTasks.length - 1]?.id);
        const newTask = createNewTask(section, lastTaskIndex + 1);

        const newTasks = [...tasks];
        newTasks.splice(lastTaskIndex + 1, 0, newTask);

        // order_indexを再設定
        const reindexedTasks = newTasks.map((task, index) => ({ ...task, order_index: index }));
        recalculateAndUpdate(reindexedTasks);
    };

    const handleDeleteTask = (e: React.MouseEvent, taskId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (readOnly) return;

        setConfirmModal({
            isOpen: true,
            message: 'このタスクを削除しますか？',
            onConfirm: () => {
                const updatedTasks = deleteTask(
                    tasks,
                    taskId,
                    new Date(project.startDate),
                    new Date(project.deliveryDate),
                    new Date(project.dueDate),
                    project.customHolidays || [],
                    new Date()
                );
                setTasks(updatedTasks);
                onUpdate({ ...project, tasks: updatedTasks });
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleMoveTask = (taskId: string, direction: 'up' | 'down') => {
        if (readOnly) return;

        const updatedTasks = moveTaskInSection(
            tasks,
            taskId,
            direction,
            new Date(project.startDate),
            new Date(project.deliveryDate),
            new Date(project.dueDate),
            project.customHolidays || [],
            new Date()
        );
        setTasks(updatedTasks);
        onUpdate({ ...project, tasks: updatedTasks });
    };

    const handleAddSection = () => {
        if (readOnly) return;
        const existingSections = Object.keys(tasksBySection);
        const newSectionName = createNewSectionName(existingSections);
        const newTask = createNewTask(newSectionName, tasks.length);

        const newTasks = [...tasks, newTask];
        recalculateAndUpdate(newTasks);
    };

    const handleDeleteSection = (e: React.MouseEvent, section: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (readOnly) return;
        const sectionTasks = tasks.filter(t => t.section === section);

        let message = '';
        if (sectionTasks.length > 0) {
            message = `セクション「${section}」には${sectionTasks.length}件のタスクが含まれています。セクションごと削除しますか？`;
        } else {
            message = `セクション「${section}」を削除しますか？`;
        }

        setConfirmModal({
            isOpen: true,
            message,
            onConfirm: () => {
                const newTasks = tasks.filter(t => t.section !== section);
                const reindexedTasks = newTasks.map((t, i) => ({ ...t, order_index: i }));
                recalculateAndUpdate(reindexedTasks);
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleMoveSection = (sectionName: string, direction: 'up' | 'down') => {
        if (readOnly) return;

        const updatedTasks = moveSection(
            tasks,
            sectionName,
            direction,
            new Date(project.startDate),
            new Date(project.deliveryDate),
            new Date(project.dueDate),
            project.customHolidays || [],
            new Date()
        );
        setTasks(updatedTasks);
        onUpdate({ ...project, tasks: updatedTasks });
    };

    const handleRenameSection = (oldName: string, newName: string) => {
        if (readOnly) return;
        if (!newName.trim()) return;

        const newTasks = tasks.map(t =>
            t.section === oldName ? { ...t, section: newName } : t
        );
        setTasks(newTasks);
        onUpdate({ ...project, tasks: newTasks });
    };

    // セクションごとにグループ化
    const tasksBySection = tasks.reduce((acc, task) => {
        if (!acc[task.section]) {
            acc[task.section] = [];
        }
        acc[task.section].push(task);
        return acc;
    }, {} as Record<string, WBSTask[]>);

    return (
        <div className={styles.container}>
            <div className={styles.toolbar}>
                <div className={styles.columnToggleContainer} ref={columnToggleRef}>
                    <button
                        className={styles.btnIcon}
                        onClick={() => setShowColumnToggle(!showColumnToggle)}
                        type="button"
                    >
                        ⚙️ 表示項目
                    </button>
                    {showColumnToggle && (
                        <div className={styles.columnToggleMenu}>
                            {Object.entries(visibleColumns).map(([key, value]) => (
                                <label key={key} className={styles.toggleItem}>
                                    <input
                                        type="checkbox"
                                        checked={visibleColumns[key as keyof typeof visibleColumns]}
                                        onChange={() => toggleColumn(key as keyof typeof visibleColumns)}
                                        disabled={
                                            (role !== 'Director' && (key === 'outsourcing' || key === 'cost'))
                                        }
                                    />
                                    <span>{
                                        key === 'completed' ? '完了' :
                                            key === 'actions' ? '追加/削除' :
                                                key === 'category' ? 'カテゴリ' :
                                                    key === 'assignee' ? '担当' :
                                                        key === 'estimate' ? '予定工数' :
                                                            key === 'type' ? '型' :
                                                                key === 'status' ? '状態' :
                                                                    key === 'startDate' ? '開始' :
                                                                        key === 'endDate' ? '終了' :
                                                                            key === 'countdown' ? '余裕' :
                                                                                key === 'outsourcing' ? '外注' : '費用'
                                    }</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {Object.entries(tasksBySection).map(([section, sectionTasks], sectionIndex, allSections) => (
                <div key={section} className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionTitleGroup}>
                            {!readOnly && (
                                <div className={styles.sectionMoveButtons}>
                                    <button
                                        onClick={() => handleMoveSection(section, 'up')}
                                        disabled={sectionIndex === 0}
                                        className={styles.btnMoveSmall}
                                        title="上に移動"
                                    >
                                        ▲
                                    </button>
                                    <button
                                        onClick={() => handleMoveSection(section, 'down')}
                                        disabled={sectionIndex === allSections.length - 1}
                                        className={styles.btnMoveSmall}
                                        title="下に移動"
                                    >
                                        ▼
                                    </button>
                                </div>
                            )}
                            <input
                                type="checkbox"
                                checked={sectionTasks.every(t => t.completed)}
                                onChange={e => handleToggleSection(section, e.target.checked)}
                                disabled={readOnly}
                                className={styles.sectionCheckbox}
                                title="セクション全完了"
                            />
                            <input
                                type="text"
                                value={section}
                                onChange={e => handleRenameSection(section, e.target.value)}
                                disabled={readOnly}
                                className={styles.sectionTitleInput}
                            />
                        </div>
                        {!readOnly && (
                            <div className={styles.sectionActions}>
                                <button
                                    type="button"
                                    onClick={() => handleAddTask(section)}
                                    className={styles.btnAddTask}
                                    title="タスクを追加"
                                >
                                    + タスク追加
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => handleDeleteSection(e, section)}
                                    className={styles.btnDeleteSection}
                                    title="セクションを削除"
                                >
                                    🗑️
                                </button>
                            </div>
                        )}
                    </div>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                {!readOnly && visibleColumns.completed && <th style={{ width: '40px' }}>完了</th>}
                                {!readOnly && visibleColumns.actions && <th style={{ width: '80px' }}>操作</th>}
                                <th>タスク名</th>
                                {visibleColumns.category && <th style={{ width: '80px' }}>カテゴリ</th>}
                                {visibleColumns.assignee && <th style={{ width: '100px' }}>担当</th>}
                                {visibleColumns.estimate && <th style={{ width: '100px' }}>予定工数</th>}
                                {visibleColumns.type && <th style={{ width: '40px' }}>型</th>}
                                {visibleColumns.status && <th style={{ width: '100px' }}>進捗</th>}
                                {visibleColumns.startDate && <th style={{ width: '60px' }}>開始</th>}
                                {visibleColumns.endDate && <th style={{ width: '60px' }}>終了</th>}
                                {visibleColumns.countdown && <th style={{ width: '60px' }}>余裕</th>}
                                {visibleColumns.outsourcing && role === 'Director' && <th style={{ width: '100px' }}>外注</th>}
                                {visibleColumns.cost && role === 'Director' && <th style={{ width: '100px' }}>費用</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {sectionTasks.map((task, index) => (
                                <tr key={task.id} className={task.completed ? styles.completedRow : ''}>
                                    {!readOnly && visibleColumns.completed && (
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={task.completed}
                                                onChange={e => handleTaskChange(task.id, 'completed', e.target.checked)}
                                                disabled={readOnly}
                                                className={styles.checkbox}
                                            />
                                        </td>
                                    )}
                                    {!readOnly && visibleColumns.actions && (
                                        <td>
                                            <div className={styles.taskActions}>
                                                <button
                                                    onClick={() => handleMoveTask(task.id, 'up')}
                                                    disabled={index === 0}
                                                    className={styles.btnMove}
                                                    title="上"
                                                >
                                                    ↑
                                                </button>
                                                <button
                                                    onClick={() => handleMoveTask(task.id, 'down')}
                                                    disabled={index === sectionTasks.length - 1}
                                                    className={styles.btnMove}
                                                    title="下"
                                                >
                                                    ↓
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleDeleteTask(e, task.id)}
                                                    className={styles.btnDelete}
                                                    title="削除"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                    <td>
                                        <input
                                            type="text"
                                            value={task.name}
                                            onChange={e => handleTaskChange(task.id, 'name', e.target.value)}
                                            disabled={readOnly}
                                            className={styles.input}
                                        />
                                    </td>
                                    {visibleColumns.category && (
                                        <td>
                                            <span className={styles.category}>{
                                                task.category === 'Planning' ? '企' :
                                                    task.category === 'Design' ? 'デ' :
                                                        task.category === 'Development' ? '実' :
                                                            task.category === 'QA' ? '検' : '公'
                                            }</span>
                                        </td>
                                    )}
                                    {visibleColumns.assignee && (
                                        <td>
                                            <select
                                                value={task.assignee}
                                                onChange={e => handleTaskChange(task.id, 'assignee', e.target.value)}
                                                disabled={readOnly}
                                                className={styles.select}
                                            >
                                                <option value="Director">ディレクター</option>
                                                <option value="Agency">代理店</option>
                                                <option value="Client">クライアント</option>
                                            </select>
                                        </td>
                                    )}
                                    {visibleColumns.estimate && (
                                        <td>
                                            <div className={styles.estimateInputs}>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={task.estimate_days}
                                                    onChange={e => handleEstimateChange(task.id, 'estimate_days', parseInt(e.target.value) || 0)}
                                                    disabled={readOnly}
                                                    className={styles.estimateInput}
                                                />
                                                <span className={styles.unit}>d</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="7"
                                                    value={task.estimate_hours}
                                                    onChange={e => handleEstimateChange(task.id, 'estimate_hours', parseInt(e.target.value) || 0)}
                                                    disabled={readOnly}
                                                    className={styles.estimateInput}
                                                />
                                                <span className={styles.unit}>h</span>
                                            </div>
                                        </td>
                                    )}
                                    {visibleColumns.type && (
                                        <td>
                                            <span className={`${styles.scheduleType} ${styles[task.schedule_type.toLowerCase()]}`}>
                                                {task.schedule_type === 'AUTO' ? '自' : task.schedule_type === 'FIXED' ? '固' : '調'}
                                            </span>
                                        </td>
                                    )}
                                    {visibleColumns.status && (
                                        <td>
                                            {readOnly ? (
                                                <StatusBadge status={task.status} />
                                            ) : (
                                                <select
                                                    value={task.status}
                                                    onChange={e => handleTaskChange(task.id, 'status', e.target.value)}
                                                    className={styles.select}
                                                >
                                                    <option value="Pending">未着手</option>
                                                    <option value="In Progress">着手中</option>
                                                    <option value="Review">確認中</option>
                                                    <option value="Done">完了</option>
                                                </select>
                                            )}
                                        </td>
                                    )}
                                    {visibleColumns.startDate && (
                                        <td>
                                            {!readOnly ? (
                                                <input
                                                    type="date"
                                                    value={task.startDate || ''}
                                                    onChange={(e) => {
                                                        const newDate = e.target.value;
                                                        const updatedTasks = project.tasks.map(t =>
                                                            t.id === task.id ? { ...t, startDate: newDate, schedule_type: 'FIXED' } : t
                                                        );
                                                        onUpdate({ ...project, tasks: updatedTasks });
                                                    }}
                                                    className={styles.dateInput}
                                                    style={{ width: '100%', fontSize: '0.8rem', padding: '2px' }}
                                                />
                                            ) : (
                                                <span className={styles.dateDisplay}>{formatDateShort(task.startDate || '')}</span>
                                            )}
                                        </td>
                                    )}
                                    {visibleColumns.endDate && (
                                        <td>
                                            <span className={styles.dateDisplay}>{formatDateShort(task.endDate || '')}</span>
                                        </td>
                                    )}
                                    {visibleColumns.countdown && (
                                        <td style={{ textAlign: 'center', fontSize: '0.8rem', color: task.countdown_to_due !== undefined && task.countdown_to_due < 0 ? '#f87171' : 'inherit' }}>
                                            {task.countdown_to_due}d
                                        </td>
                                    )}
                                    {visibleColumns.outsourcing && role === 'Director' && (
                                        <td>
                                            <label className={styles.outsourcingLabel}>
                                                <input
                                                    type="checkbox"
                                                    checked={task.isOutsourced || false}
                                                    onChange={e => handleTaskChange(task.id, 'isOutsourced', e.target.checked)}
                                                    disabled={readOnly}
                                                />
                                                <span style={{ fontSize: '0.75rem', marginLeft: '4px' }}>外注</span>
                                            </label>
                                        </td>
                                    )}
                                    {visibleColumns.cost && role === 'Director' && (
                                        <td>
                                            <div className={styles.costDisplay} title="計上費用">
                                                ¥{(((task.completed ? (task.estimate_days * 8 + task.estimate_hours) : 0) + (task.overtime_days || 0) * 8 + (task.overtime_hours || 0)) * (project.hourlyRate || 8000)).toLocaleString()}
                                            </div>
                                            <div style={{ fontSize: '0.65rem', opacity: 0.5 }} title="推定費用">
                                                (¥{(((task.estimate_days * 8) + task.estimate_hours) * (project.hourlyRate || 8000)).toLocaleString()})
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}

            {!readOnly && (
                <div className={styles.addSectionContainer}>
                    <button onClick={handleAddSection} className={styles.btnAddSection}>
                        + 新しいセクション
                    </button>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
