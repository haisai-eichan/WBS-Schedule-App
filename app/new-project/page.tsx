'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateWBS, TEMPLATES } from '@/lib/wbsTemplates';
import { saveProject, Project } from '@/lib/storage';
import styles from './page.module.css';

export default function NewProject() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        clientName: '',
        template: 'WEBSITE',
        director: '',
        agency: '',
        client: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newProject: Project = {
            id: crypto.randomUUID(),
            name: formData.name,
            clientName: formData.clientName,
            template: formData.template,
            createdAt: new Date().toISOString(),
            tasks: generateWBS(formData.template as keyof typeof TEMPLATES),
            stakeholders: {
                director: formData.director,
                agency: formData.agency,
                client: formData.client,
            },
        };

        saveProject(newProject);
        router.push(`/project/${newProject.id}`);
    };

    return (
        <div className="container">
            <h1 className={styles.title}>Create New Project</h1>

            <form onSubmit={handleSubmit} className={styles.form}>
                <section className="glass-panel" style={{ padding: '2rem' }}>
                    <h2 className={styles.sectionTitle}>Project Details</h2>
                    <div className={styles.grid}>
                        <div className={styles.field}>
                            <label>Project Name</label>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Corporate Website Renewal"
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Client Name</label>
                            <input
                                required
                                type="text"
                                value={formData.clientName}
                                onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                                placeholder="e.g. Acme Corp"
                            />
                        </div>
                    </div>
                </section>

                <section className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
                    <h2 className={styles.sectionTitle}>Select Template</h2>
                    <div className={styles.templates}>
                        {Object.keys(TEMPLATES).map(key => (
                            <div
                                key={key}
                                className={`${styles.templateCard} ${formData.template === key ? styles.selected : ''}`}
                                onClick={() => setFormData({ ...formData, template: key })}
                            >
                                <h3>{key}</h3>
                                <p>{TEMPLATES[key as keyof typeof TEMPLATES].length} Standard Tasks</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
                    <h2 className={styles.sectionTitle}>Stakeholders</h2>
                    <div className={styles.grid}>
                        <div className={styles.field}>
                            <label>Director (You)</label>
                            <input
                                type="text"
                                value={formData.director}
                                onChange={e => setFormData({ ...formData, director: e.target.value })}
                                placeholder="Name"
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Agency Contact</label>
                            <input
                                type="text"
                                value={formData.agency}
                                onChange={e => setFormData({ ...formData, agency: e.target.value })}
                                placeholder="Name"
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Client Contact</label>
                            <input
                                type="text"
                                value={formData.client}
                                onChange={e => setFormData({ ...formData, client: e.target.value })}
                                placeholder="Name"
                            />
                        </div>
                    </div>
                </section>

                <div className={styles.actions}>
                    <button type="submit" className="btn-primary">
                        Create Project & Generate WBS
                    </button>
                </div>
            </form>
        </div>
    );
}
