'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateWBS, TEMPLATES } from '@/lib/wbsTemplates';
import { generateTasksFromText } from '@/lib/smartScheduleGenerator';
import { createProject, Project } from '@/lib/storage';
import { calculateSchedule } from '@/lib/scheduleCalculator';
import styles from './page.module.css';

export default function NewProject() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // デフォルトの開始日と納品日を設定
    const today = new Date();
    const defaultStartDate = today.toISOString().split('T')[0];
    const defaultDueDate = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 60日後

    const [formData, setFormData] = useState({
        name: '',
        clientName: '',
        template: 'WEB_SITE',
        requirements: '', // 新規追加: 要件テキスト
        director: '',
        agency: '',
        client: '',
        startDate: defaultStartDate,
        dueDate: defaultDueDate,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            // WBSを生成 (要件テキストがある場合はAI簡易生成、なければテンプレート)
            let tasks;
            if (formData.requirements && formData.requirements.trim().length > 10) {
                tasks = generateTasksFromText(formData.requirements);
            } else {
                tasks = generateWBS(formData.template as keyof typeof TEMPLATES);
            }

            // スケジュールを自動計算
            const calculatedTasks = calculateSchedule(
                tasks,
                new Date(formData.startDate),
                new Date(formData.dueDate),
                new Date(formData.dueDate), // deliveryDate defaults to dueDate initially
                [] as string[],
                new Date() // 現在日時
            );

            const newProject: Project = {
                id: crypto.randomUUID(),
                name: formData.name,
                clientName: formData.clientName,
                template: formData.template,
                createdAt: new Date().toISOString(),
                tasks: calculatedTasks,
                stakeholders: {
                    director: formData.director,
                    agency: formData.agency,
                    client: formData.client,
                },
                startDate: formData.startDate,
                deliveryDate: formData.dueDate, // Default to dueDate
                dueDate: formData.dueDate,
                customHolidays: [],
            };

            await createProject(newProject);
            router.push(`/project/${newProject.id}`);
        } catch (error) {
            console.error('Failed to create project:', error);
            setIsSubmitting(false);
            alert('プロジェクトの作成に失敗しました。');
        }
    };

    return (
        <div className="container">
            <h1 className={styles.title}>新規プロジェクト作成</h1>

            <form onSubmit={handleSubmit} className={styles.form}>
                <section className="glass-panel" style={{ padding: '2rem' }}>
                    <h2 className={styles.sectionTitle}>プロジェクト詳細</h2>
                    <div className={styles.grid}>
                        <div className={styles.field}>
                            <label>プロジェクト名</label>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="例: コーポレートサイト・リニューアル"
                            />
                        </div>
                        <div className={styles.field}>
                            <label>クライアント名</label>
                            <input
                                required
                                type="text"
                                value={formData.clientName}
                                onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                                placeholder="例: 株式会社ABC"
                            />
                        </div>
                    </div>

                    <div className={styles.grid} style={{ marginTop: '1.5rem' }}>
                        <div className={styles.field}>
                            <label>開始日</label>
                            <input
                                required
                                type="date"
                                min="2020-01-01"
                                max="2050-12-31"
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>
                        <div className={styles.field}>
                            <label>納品予定日</label>
                            <input
                                required
                                type="date"
                                min="2020-01-01"
                                max="2050-12-31"
                                value={formData.dueDate}
                                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                            />
                        </div>
                    </div>
                </section>

                <section className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
                    <h2 className={styles.sectionTitle}>制作要件・メモ (AI自動生成)</h2>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                        クライアントからのヒアリング内容や要件を貼り付けると、自動でタスクを作成・調整します。<br />
                        ページ数（例: 「10ページ」）や機能（例: 「ログイン」「フォーム」）を含めると精度が上がります。
                    </p>
                    <textarea
                        className="input"
                        style={{ width: '100%', minHeight: '150px', padding: '1rem', lineHeight: '1.6' }}
                        placeholder="例: コーポレートサイトのリニューアル案件です。&#13;&#10;TOPページと、会社概要、サービス紹介、採用情報など計8ページ程度。&#13;&#10;WordPressでお知らせを更新できるようにしたい。&#13;&#10;お問い合わせフォームも必要です。"
                        value={formData.requirements}
                        onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                    />
                    {formData.requirements.length > 0 && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '0.5rem', fontWeight: 600 }}>
                            ✨ この内容からタスクを自動生成します (テンプレート選択はベースとして使用されます)
                        </p>
                    )}
                </section>

                <section className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
                    <h2 className={styles.sectionTitle}>ベーステンプレート選択</h2>
                    <div className={styles.templates}>
                        {Object.keys(TEMPLATES).map(key => (
                            <div
                                key={key}
                                className={`${styles.templateCard} ${formData.template === key ? styles.selected : ''}`}
                                onClick={() => setFormData({ ...formData, template: key })}
                            >
                                <h3>{key === 'WEB_SITE' ? 'WEBサイト (CMSあり)' : 'LP (CMSなし)'}</h3>
                                <p>{TEMPLATES[key as keyof typeof TEMPLATES].length} タスク</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
                    <h2 className={styles.sectionTitle}>ステークホルダー</h2>
                    <div className={styles.grid}>
                        <div className={styles.field}>
                            <label>ディレクター (あなた)</label>
                            <input
                                type="text"
                                value={formData.director}
                                onChange={e => setFormData({ ...formData, director: e.target.value })}
                                placeholder="お名前"
                            />
                        </div>
                        <div className={styles.field}>
                            <label>代理店 担当者</label>
                            <input
                                type="text"
                                value={formData.agency}
                                onChange={e => setFormData({ ...formData, agency: e.target.value })}
                                placeholder="お名前"
                            />
                        </div>
                        <div className={styles.field}>
                            <label>クライアント 担当者</label>
                            <input
                                type="text"
                                value={formData.client}
                                onChange={e => setFormData({ ...formData, client: e.target.value })}
                                placeholder="お名前"
                            />
                        </div>
                    </div>
                </section>

                <div className={styles.actions}>
                    <button type="submit" className="btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? '作成中...' : 'プロジェクト作成 & WBS生成'}
                    </button>
                </div>
            </form>
        </div>
    );
}

