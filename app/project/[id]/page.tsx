'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getProjects, updateProject, Project } from '@/lib/storage';
import WBSEditor from '@/components/WBSEditor';
import Link from 'next/link';

export default function ProjectDetail() {
    const params = useParams();
    const [project, setProject] = useState<Project | null>(null);
    const [role, setRole] = useState<'Director' | 'Agency' | 'Client'>('Director');

    useEffect(() => {
        if (params.id) {
            const projects = getProjects();
            const found = projects.find(p => p.id === params.id);
            if (found) setProject(found);
        }
    }, [params.id]);

    const handleUpdate = (updatedProject: Project) => {
        setProject(updatedProject);
        updateProject(updatedProject);
    };

    if (!project) return <div className="container">Loading...</div>;

    const isReadOnly = role === 'Client';

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <Link href="/" style={{ color: '#888', fontSize: '0.9rem' }}>← Back to Dashboard</Link>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem' }}>{project.name}</h1>
                    <p style={{ color: '#888' }}>Client: {project.clientName}</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: '#888' }}>View as:</span>
                        <select
                            value={role}
                            onChange={e => setRole(e.target.value as any)}
                            style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                        >
                            <option value="Director">Director</option>
                            <option value="Agency">Agency</option>
                            <option value="Client">Client</option>
                        </select>
                    </div>
                    <button className="btn-primary">Share</button>
                </div>
            </div>

            <WBSEditor
                project={project}
                onUpdate={handleUpdate}
                readOnly={isReadOnly}
            />
        </div>
    );
}
