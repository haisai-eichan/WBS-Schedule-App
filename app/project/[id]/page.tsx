'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Project, getProjectById, updateProject } from '@/lib/storage';
import { calculateSchedule, validateSchedule, calculateProgress, calculateProjectFinancials } from '@/lib/scheduleCalculator';
import WBSEditor from '@/components/WBSEditor';
import Link from 'next/link';

const CurrencyInput = ({ value, onChange, disabled }: { value: number, onChange: (val: number) => void, disabled?: boolean }) => {
    const [isFocused, setIsFocused] = useState(false);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        if (isFocused) {
            setInputValue(value.toString());
        } else {
            setInputValue(value ? `¥${value.toLocaleString()}` : '');
        }
    }, [value, isFocused]);

    const handleFocus = () => {
        setIsFocused(true);
        setInputValue(value ? value.toString() : '');
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        // 全角数字を半角に変換
        val = val.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
        // 数字以外を削除
        val = val.replace(/[^0-9]/g, '');
        // 数値化（先頭の0も消える）
        const num = parseInt(val, 10);
        if (!isNaN(num)) {
            onChange(num);
        } else if (val === '') {
            onChange(0);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            onChange((value || 0) + 500);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            onChange(Math.max(0, (value || 0) - 500));
        }
    };

    return (
        <input
            type="text"
            value={inputValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="input"
            style={{ fontSize: '1rem', fontWeight: 700 }}
            placeholder="¥0"
        />
    );
};

export default function ProjectDetail() {
    const params = useParams();
    const searchParams = useSearchParams();
    const [project, setProject] = useState<Project | null>(null);
    const [role, setRole] = useState<'Director' | 'Agency' | 'Client'>('Director');
    const [isRoleLocked, setIsRoleLocked] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    useEffect(() => {
        const roleParam = searchParams.get('role');
        if (roleParam === 'Agency' || roleParam === 'Client') {
            setRole(roleParam);
            setIsRoleLocked(true);
        }
    }, [searchParams]);

    useEffect(() => {
        if (params.id) {
            const found = getProjectById(params.id as string);
            if (found) setProject(found);
        }
    }, [params.id]);

    const handleUpdate = (updatedProject: Project) => {
        // タスク更新時に自動再計算
        const recalculatedTasks = calculateSchedule(
            updatedProject.tasks,
            new Date(updatedProject.startDate),
            new Date(updatedProject.deliveryDate),
            new Date(updatedProject.dueDate),
            updatedProject.customHolidays || [],
            new Date()
        );
        const finalProject = { ...updatedProject, tasks: recalculatedTasks };
        setProject(finalProject);
        updateProject(finalProject);
    };

    const handleProjectFieldChange = (field: keyof Project, value: any) => {
        if (!project) return;

        let newProject = { ...project, [field]: value };

        // 日付や休日が変更された場合はスケジュール再計算
        if (field === 'startDate' || field === 'deliveryDate' || field === 'dueDate' || field === 'customHolidays') {
            const recalculatedTasks = calculateSchedule(
                newProject.tasks,
                new Date(newProject.startDate),
                new Date(newProject.deliveryDate),
                new Date(newProject.dueDate),
                newProject.customHolidays || [],
                new Date()
            );
            newProject = { ...newProject, tasks: recalculatedTasks };
        }

        handleUpdate(newProject);
    };

    const handleDownload = () => {
        if (!project) return;

        const dataStr = JSON.stringify(project, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `wbs_project_${project.id}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedProject = JSON.parse(event.target?.result as string) as Project;
                if (importedProject.id && importedProject.tasks) {
                    handleUpdate(importedProject);
                    alert('プロジェクトデータをインポートしました。');
                } else {
                    alert('無効なファイル形式です。');
                }
            } catch (err) {
                alert('ファイルの読み込みに失敗しました。');
            }
        };
        reader.readAsText(file);
    };

    if (!project) return <div className="container">読み込み中...</div>;

    const isReadOnly = role === 'Client';
    const validation = validateSchedule(project.tasks, new Date(project.deliveryDate), new Date(project.dueDate), project.customHolidays || [], new Date());
    const progress = calculateProgress(project.tasks);
    const totalEstimatedHours = project.tasks.reduce((sum, t) => sum + (t.estimate_days || 0) * 8 + (t.estimate_hours || 0), 0);
    const effectiveHourlyRate = totalEstimatedHours > 0
        ? Math.round(((project.totalBudget || 0) - (project.outsourcingCost || 0)) / totalEstimatedHours)
        : 8000;

    const financials = calculateProjectFinancials(
        project.tasks,
        effectiveHourlyRate,
        project.totalBudget,
        project.outsourcingCost || 0
    );

    return (
        <div className="container animate-fadeIn">
            <header style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <Link href="/" style={{ color: '#888', fontSize: '0.9rem' }}>← ダッシュボードに戻る</Link>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem' }}>{project.name}</h1>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {!isRoleLocked && (
                            <div className="glass-panel" style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', color: '#888' }}>表示:</span>
                                <select
                                    value={role}
                                    onChange={e => setRole(e.target.value as any)}
                                    className="input"
                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', width: 'auto' }}
                                >
                                    <option value="Director">ディレクター (制作担当)</option>
                                    <option value="Agency">代理店</option>
                                    <option value="Client">クライアント</option>
                                </select>
                            </div>
                        )}
                        {!isRoleLocked && (
                            <button
                                className="btn-primary"
                                onClick={() => setShowShareModal(true)}
                                style={{ background: 'var(--accent)', border: 'none', fontSize: '0.85rem', padding: '0.6rem 1rem' }}
                            >
                                🔗 シェア
                            </button>
                        )}
                        {!isReadOnly && !isRoleLocked && (
                            <>
                                <label className="btn-primary" style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid var(--card-border)', fontSize: '0.85rem', padding: '0.6rem 1rem', cursor: 'pointer' }}>
                                    📤 インポート
                                    <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                                </label>
                            </>
                        )}
                        <button
                            className="btn-primary"
                            onClick={handleDownload}
                            style={{ background: 'rgba(100, 200, 100, 0.15)', border: '1px solid #64c864', fontSize: '0.85rem', padding: '0.6rem 1rem' }}
                        >
                            📥 DL
                        </button>
                    </div>
                </div>

                {/* 3点セット日程設定 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
                    <div className="glass-panel" style={{ padding: '1rem', transition: 'all 0.2s' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--foreground)', opacity: 0.8, display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>開始日</label>
                        <input
                            type="date"
                            value={project.startDate}
                            onChange={e => handleProjectFieldChange('startDate', e.target.value)}
                            className="input"
                            style={{
                                padding: '0.2rem 0',
                                fontSize: '1.1rem',
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--foreground)',
                                fontWeight: 700
                            }}
                            disabled={isReadOnly}
                        />
                    </div>
                    <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid var(--primary)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'block', marginBottom: '0.4rem', fontWeight: 800 }}>納品日 (内部目標)</label>
                        <input
                            type="date"
                            value={project.deliveryDate}
                            onChange={e => handleProjectFieldChange('deliveryDate', e.target.value)}
                            className="input"
                            style={{
                                padding: '0.2rem 0',
                                fontSize: '1.2rem',
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--foreground)',
                                fontWeight: 800
                            }}
                            disabled={isReadOnly}
                        />
                    </div>
                    <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid #f87171' }}>
                        <label style={{ fontSize: '0.75rem', color: '#f87171', display: 'block', marginBottom: '0.4rem', fontWeight: 800 }}>納期 (デッドライン)</label>
                        <input
                            type="date"
                            value={project.dueDate}
                            onChange={e => handleProjectFieldChange('dueDate', e.target.value)}
                            className="input"
                            style={{
                                padding: '0.2rem 0',
                                fontSize: '1.2rem',
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--foreground)',
                                fontWeight: 800
                            }}
                            disabled={isReadOnly}
                        />
                    </div>
                </div>

                {/* ダッシュボードセクション */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    {/* 進捗ダッシュボード */}
                    <div className="card" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--foreground)', opacity: 0.7, fontWeight: 600 }}>プロジェクト進捗率</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{progress}%</span>
                        </div>
                        <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
                            <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--accent))', transition: 'width 0.5s ease-out' }}></div>
                        </div>
                        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <div>
                                <span style={{ color: 'var(--foreground)', opacity: 0.7 }}>残営業日:</span> <span style={{ fontWeight: 600 }}>{validation.remainingBusinessDays}日</span>
                            </div>
                            {role === 'Director' && (
                                <div>
                                    <span style={{ color: 'var(--foreground)', opacity: 0.7 }}>残総時間:</span> <span style={{ fontWeight: 600 }}>{validation.totalRemainingHours}h</span>
                                </div>
                            )}
                        </div>
                        {validation.message && (
                            <div style={{
                                marginTop: '1.2rem',
                                padding: '0.8rem 1.2rem',
                                background: validation.isValid ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                                border: `1px solid ${validation.isValid ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.2)'}`,
                                borderRadius: '10px',
                                color: validation.isValid ? '#4ade80' : '#f87171',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.6rem',
                                fontSize: '0.9rem'
                            }}>
                                <span style={{ fontSize: '1.1rem' }}>{validation.isValid ? '✅' : '🚨'}</span>
                                {validation.message}
                            </div>
                        )}
                    </div>

                    {/* 予算・コスト管理 (Directorのみ) */}
                    {role === 'Director' && (
                        <div className="card" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--foreground)', opacity: 0.8, display: 'block', marginBottom: '0.2rem' }}>受注金額 (税抜)</label>
                                    <CurrencyInput
                                        value={project.totalBudget || 0}
                                        onChange={val => handleProjectFieldChange('totalBudget', val)}
                                        disabled={isReadOnly}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--foreground)', opacity: 0.8, display: 'block', marginBottom: '0.2rem' }}>外注費 (税抜)</label>
                                    <CurrencyInput
                                        value={project.outsourcingCost || 0}
                                        onChange={val => handleProjectFieldChange('outsourcingCost', val)}
                                        disabled={isReadOnly}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--foreground)', fontWeight: 600 }}>実質時間単価 (自動計算)</span>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                                        ¥{(() => {
                                            const totalEstHours = project.tasks.reduce((sum, t) => sum + (t.estimate_days || 0) * 8 + (t.estimate_hours || 0), 0);
                                            const budget = (project.totalBudget || 0) - (project.outsourcingCost || 0);
                                            return totalEstHours > 0 ? Math.round(budget / totalEstHours).toLocaleString() : 0;
                                        })()}
                                        <span style={{ fontSize: '0.8rem', fontWeight: 'normal', opacity: 0.7 }}> /h</span>
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '0.5rem' }}>
                                    ※ (受注金額 - 外注費) ÷ 総予定工数 で算出
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#888' }}>受注金額</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                                        ¥{(project.totalBudget || 0).toLocaleString()}
                                    </div>
                                </div>
                                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#888' }}>消化予算 (目安)</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: financials.actualCost > (project.totalBudget || 0) ? '#f87171' : 'inherit' }}>
                                        ¥{financials.actualCost.toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>(進捗ベース)</div>
                                </div>
                            </div>

                            {financials.isDeficitRisk && (
                                <div style={{
                                    marginTop: '1rem',
                                    padding: '0.8rem',
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                    borderRadius: '10px',
                                    color: '#f59e0b',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    ⚠️ 赤字リスク予測: 最終予測 ¥{financials.predictedTotalCost.toLocaleString()}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>

            <WBSEditor
                project={{ ...project, hourlyRate: effectiveHourlyRate }}
                onUpdate={handleUpdate}
                readOnly={isReadOnly}
                role={role}
            />

            {showShareModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }} onClick={() => setShowShareModal(false)}>
                    <div className="glass-panel" style={{ padding: '2rem', width: '500px', maxWidth: '90%' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem' }}>プロジェクトをシェア</h2>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                                1. クライアント共有用 (予算非表示・閲覧専用)
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input type="text" readOnly className="input" value={`${window.location.origin}/project/${project.id}?role=Client`} style={{ flex: 1, fontSize: '0.8rem' }} />
                                <button className="btn-primary" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/project/${project.id}?role=Client`)}>Copy</button>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '0.5rem' }}>
                                2. 代理店共有用 (外注費非表示)
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input type="text" readOnly className="input" value={`${window.location.origin}/project/${project.id}?role=Agency`} style={{ flex: 1, fontSize: '0.8rem' }} />
                                <button className="btn-primary" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/project/${project.id}?role=Agency`)}>Copy</button>
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem' }}>
                                3. ディレクター (全権限)
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input type="text" readOnly className="input" value={`${window.location.origin}/project/${project.id}`} style={{ flex: 1, fontSize: '0.8rem' }} />
                                <button className="btn-primary" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/project/${project.id}`)}>Copy</button>
                            </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            <button className="btn-primary" style={{ background: '#666' }} onClick={() => setShowShareModal(false)}>閉じる</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
