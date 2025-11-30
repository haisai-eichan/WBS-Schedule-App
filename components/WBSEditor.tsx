'use client';

import { useState } from 'react';
import { Project } from '@/lib/storage';
import { WBSTask } from '@/lib/wbsTemplates';
import StatusBadge from './StatusBadge';
import styles from './WBSEditor.module.css';

interface Props {
    project: Project;
    onUpdate: (project: Project) => void;
    readOnly?: boolean;
}

export default function WBSEditor({ project, onUpdate, readOnly = false }: Props) {
    const [tasks, setTasks] = useState<WBSTask[]>(project.tasks);

    const handleTaskChange = (id: string, field: keyof WBSTask, value: any) => {
        if (readOnly) return;
        const newTasks = tasks.map(t => t.id === id ? { ...t, [field]: value } : t);
        setTasks(newTasks);
        onUpdate({ ...project, tasks: newTasks });
    };

    return (
        <div className={styles.container}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Task Name</th>
                        <th>Category</th>
                        <th>Assignee</th>
                        <th>Status</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.map(task => (
                        <tr key={task.id}>
                            <td>
                                <input
                                    type="text"
                                    value={task.name}
                                    onChange={e => handleTaskChange(task.id, 'name', e.target.value)}
                                    disabled={readOnly}
                                    className={styles.input}
                                />
                            </td>
                            <td>
                                <span className={styles.category}>{task.category}</span>
                            </td>
                            <td>
                                <select
                                    value={task.assignee}
                                    onChange={e => handleTaskChange(task.id, 'assignee', e.target.value)}
                                    disabled={readOnly}
                                    className={styles.select}
                                >
                                    <option value="Director">Director</option>
                                    <option value="Agency">Agency</option>
                                    <option value="Client">Client</option>
                                </select>
                            </td>
                            <td>
                                {readOnly ? (
                                    <StatusBadge status={task.status} />
                                ) : (
                                    <select
                                        value={task.status}
                                        onChange={e => handleTaskChange(task.id, 'status', e.target.value)}
                                        className={styles.select}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Review">Review</option>
                                        <option value="Done">Done</option>
                                    </select>
                                )}
                            </td>
                            <td>
                                <input
                                    type="date"
                                    value={task.startDate || ''}
                                    onChange={e => handleTaskChange(task.id, 'startDate', e.target.value)}
                                    disabled={readOnly}
                                    className={styles.dateInput}
                                />
                            </td>
                            <td>
                                <input
                                    type="date"
                                    value={task.endDate || ''}
                                    onChange={e => handleTaskChange(task.id, 'endDate', e.target.value)}
                                    disabled={readOnly}
                                    className={styles.dateInput}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
