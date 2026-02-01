'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchProjects, Project, deleteProject } from '@/lib/storage';

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects().then(data => {
      setProjects(data);
      setLoading(false);
    });
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`本当にプロジェクト「${name}」を削除しますか？\nこの操作は取り消せません。`)) {
      await deleteProject(id);
      const data = await fetchProjects();
      setProjects(data);
    }
  };

  return (
    <div className="container">
      <header style={{ margin: "4rem 0", textAlign: "center" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: 800, marginBottom: "1rem", background: "linear-gradient(to right, #000, #555)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Manage Projects with Precision
        </h1>
        <p style={{ color: "#888", fontSize: "1.2rem", maxWidth: "600px", margin: "0 auto 2rem" }}>
          The premium WBS tool for directors, agencies, and clients.
        </p>
        <Link href="/new-project" className="btn-primary">
          + Create New Project
        </Link>
      </header>

      <section>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Active Projects</h2>

        {loading ? (
          <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", color: "#666" }}>
            <p>Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", color: "#666" }}>
            <p style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>No projects found yet.</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Start by creating your first project schedule.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {projects.map(project => (
              <div key={project.id} className="glass-panel" style={{
                display: 'block',
                padding: '1.5rem',
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'relative'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <button
                  onClick={(e) => handleDelete(e, project.id, project.name)}
                  className="delete-btn"
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #fee2e2',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    color: '#ef4444',
                    zIndex: 10,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.background = '#fee2e2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                  }}
                  title="プロジェクトを削除"
                >
                  🗑️
                </button>
                <Link href={`/project/${project.id}`} legacyBehavior>
                  <a style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        background: '#e0f2fe',
                        color: '#0369a1',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '99px'
                      }}>
                        {project.template === 'WEB_SITE' ? 'WEB SITE' : 'LP'}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#999' }}>
                        {new Date(project.updatedAt || project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.4 }}>
                      {project.name}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>
                      {project.clientName}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#555', borderTop: '1px solid #f0f0f0', paddingTop: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#999', marginBottom: '0.2rem' }}>納品日</div>
                        <div>{project.deliveryDate || project.dueDate}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: '#999', marginBottom: '0.2rem' }}>進捗</div>
                        <div style={{ fontWeight: 600, color: 'var(--primary)' }}>
                          {Math.round((project.tasks.filter(t => t.completed).length / project.tasks.length) * 100 || 0)}%
                        </div>
                      </div>
                    </div>
                  </a>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
