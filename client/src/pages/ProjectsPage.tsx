import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI } from '../lib/api';
import { Plus, Trash2, Search, Folder, Calendar, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Project {
  _id: string;
  name: string;
  description?: string;
  tags: string[];
  totalRowsGenerated: number;
  totalExports: number;
  lastGeneratedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [createMode, setCreateMode] = useState<'blank' | 'sql'>('blank');
  const [sqlContent, setSqlContent] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      const res = await projectsAPI.list();
      setProjects(res.data.projects || []);
      setFilteredProjects(res.data.projects || []);
    } catch (err: any) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const term = search.toLowerCase();
    const filtered = projects.filter(p =>
      p.name.toLowerCase().includes(term) ||
      (p.description && p.description.toLowerCase().includes(term)) ||
      p.tags.some(t => t.toLowerCase().includes(term))
    );
    setFilteredProjects(filtered);
  }, [search, projects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return toast.error('Project name is required');
    setCreating(true);
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const res = await projectsAPI.create({ name, description, tags });
      const newProj = res.data.project;
      toast.success('Project created successfully!');
      setShowModal(false);
      setName('');
      setDescription('');
      setTagsInput('');
      navigate(`/projects/${newProj._id}/editor`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent navigating to project details
    if (!confirm('Are you sure you want to delete this project? This will delete all schemas and history.')) return;
    try {
      await projectsAPI.delete(id);
      toast.success('Project deleted');
      fetchProjects();
    } catch (err: any) {
      toast.error('Failed to delete project');
    }
  };

  return (
    <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800 }}>
            Project Workspaces
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Create and edit relational database testing schemas
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ position: 'relative', maxWidth: 400 }}>
        <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          className="input"
          placeholder="Search by name, description or tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 42 }}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {[1, 2, 3].map(n => (
            <div key={n} className="skeleton" style={{ height: 180, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="glass" style={{ padding: 64, textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <Folder size={48} color="var(--text-muted)" />
          <div>
            <h3>No Projects Found</h3>
            <p style={{ fontSize: 13, marginTop: 4 }}>
              {search ? 'No projects match your search query.' : 'Get started by building a schema database.'}
            </p>
          </div>
          {!search && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              Create First Project
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {filteredProjects.map(project => (
            <div
              key={project._id}
              className="glass-card"
              onClick={() => navigate(`/projects/${project._id}/editor`)}
              style={{
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                minHeight: 180,
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 12 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {project.name}
                  </h3>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={(e) => handleDelete(project._id, e)}
                    style={{ padding: 6, color: 'var(--text-muted)', border: 'none' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 16 }}>
                  {project.description || 'No description provided.'}
                </p>
              </div>

              <div>
                {/* Tags */}
                {project.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {project.tags.map(tag => (
                      <span key={tag} className="badge badge-primary" style={{ fontSize: 9, padding: '1px 8px' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {/* Metadata */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} /> {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                  <span>{project.totalRowsGenerated} rows gen</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal animate-fade-in" style={{ position: 'relative', maxWidth: 560 }}>
            <button
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', right: 24, top: 24, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={20} />
            </button>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={20} color="var(--primary)" /> New Project Workspace
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 18 }}>
              Design a database from scratch or paste your friend's existing SQL DDL script!
            </p>

            {/* Mode Switcher Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'var(--bg-elevated)', padding: 4, borderRadius: 'var(--radius-md)' }}>
              <button
                type="button"
                className={`tab-btn ${createMode === 'blank' ? 'active' : ''}`}
                onClick={() => setCreateMode('blank')}
              >
                Blank / AI Prompt
              </button>
              <button
                type="button"
                className={`tab-btn ${createMode === 'sql' ? 'active' : ''}`}
                onClick={() => setCreateMode('sql')}
              >
                Import SQL DDL Script
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!name) return toast.error('Project name is required');
                setCreating(true);
                try {
                  let newProj;
                  if (createMode === 'sql') {
                    if (!sqlContent.trim()) return toast.error('Please paste SQL DDL statements');
                    const res = await projectsAPI.importSQL({ name, description, sqlContent });
                    newProj = res.data.project;
                    toast.success('SQL Database imported & parsed successfully!');
                  } else {
                    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
                    const res = await projectsAPI.create({ name, description, tags });
                    newProj = res.data.project;
                    toast.success('Project created successfully!');
                  }
                  setShowModal(false);
                  setName('');
                  setDescription('');
                  setSqlContent('');
                  setTagsInput('');
                  navigate(`/projects/${newProj._id}/editor`);
                } catch (err: any) {
                  toast.error(err.response?.data?.error || 'Failed to create project');
                } finally {
                  setCreating(false);
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div>
                <label className="input-label">Project Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Friend's Production DB"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="input-label">Description (Optional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Summarize the schema's purpose..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {createMode === 'sql' ? (
                <div>
                  <label className="input-label">Paste SQL DDL Script (CREATE TABLE statements)</label>
                  <textarea
                    className="input"
                    placeholder={`CREATE TABLE users (\n  id UUID PRIMARY KEY,\n  full_name VARCHAR(255),\n  email VARCHAR(255) UNIQUE\n);\n\nCREATE TABLE orders (\n  id UUID PRIMARY KEY,\n  user_id UUID REFERENCES users(id),\n  amount DECIMAL(10,2)\n);`}
                    value={sqlContent}
                    onChange={(e) => setSqlContent(e.target.value)}
                    style={{ minHeight: 140, fontFamily: 'var(--font-mono)', fontSize: 12, resize: 'vertical' }}
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="input-label">Tags (comma-separated, optional)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. banking, audit, reporting"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Processing...' : createMode === 'sql' ? 'Import & Parse SQL Database' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
