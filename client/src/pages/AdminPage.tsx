import { useEffect, useState } from 'react';
import { adminAPI, marketplaceAPI } from '../lib/api';
import { Shield, Users, Server, Database, Trash2, Plus, X, Eye, Terminal } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserObj {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

interface SystemJob {
  _id: string;
  projectId: { name: string } | null;
  userId: { name: string; email: string } | null;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  rowsTotal: number;
  rowsGenerated: number;
  exportFormat: string;
  createdAt: string;
}

interface Template {
  _id: string;
  name: string;
  description: string;
  category: string;
  usageCount: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<UserObj[]>([]);
  const [jobs, setJobs] = useState<SystemJob[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'jobs' | 'templates'>('users');
  const [loading, setLoading] = useState(true);

  // Add Template Modal Form State
  const [showModal, setShowModal] = useState(false);
  const [tName, setTName] = useState('');
  const [tDesc, setTDesc] = useState('');
  const [tCat, setTCat] = useState('');
  const [tIcon, setTIcon] = useState('🗄️');
  const [tTags, setTTags] = useState('');
  const [tSchemaJson, setTSchemaJson] = useState('{\n  "tables": [],\n  "flowEdges": []\n}');

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, jobsRes, templatesRes] = await Promise.all([
        adminAPI.stats(),
        adminAPI.users(),
        adminAPI.jobs(),
        marketplaceAPI.list(), // list built-in templates
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users || []);
      setJobs(jobsRes.data.jobs || []);
      setTemplates(templatesRes.data.templates || []);
    } catch (err: any) {
      toast.error('Failed to load administrative panel data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user account?')) return;
    try {
      await adminAPI.deleteUser(userId);
      toast.success('User profile removed');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this marketplace template?')) return;
    try {
      await adminAPI.deleteTemplate(templateId);
      toast.success('Marketplace template deleted');
      fetchData();
    } catch (err: any) {
      toast.error('Failed to delete template');
    }
  };

  const handleAddTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName || !tDesc || !tCat) return toast.error('Please enter name, description and category');
    try {
      const parsedSchema = JSON.parse(tSchemaJson);
      const payload = {
        name: tName,
        description: tDesc,
        category: tCat,
        icon: tIcon,
        tags: tTags.split(',').map(t => t.trim()).filter(Boolean),
        tables: parsedSchema.tables || [],
        flowEdges: parsedSchema.flowEdges || parsedSchema.edges || [],
        isBuiltIn: true,
      };

      await adminAPI.addTemplate(payload);
      toast.success('New template added to marketplace!');
      setShowModal(false);
      // Reset form
      setTName('');
      setTDesc('');
      setTCat('');
      setTIcon('🗄️');
      setTTags('');
      setTSchemaJson('{\n  "tables": [],\n  "flowEdges": []\n}');
      fetchData();
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        toast.error('Invalid JSON syntax inside the Schema JSON text field.');
      } else {
        toast.error(err.response?.data?.error || 'Failed to save template');
      }
    }
  };

  return (
    <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'linear-gradient(135deg, var(--danger), #ff4d4d)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px rgba(255, 77, 77, 0.35)',
        }}>
          <Shield size={20} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800 }}>
            DataForge Admin Console
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            Manage platform metrics, registered users, and marketplace templates
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {[1, 2, 3, 4].map(n => <div key={n} className="skeleton" style={{ height: 100, borderRadius: 12 }} />)}
          </div>
          <div className="skeleton" style={{ height: 300, borderRadius: 12 }} />
        </div>
      ) : (
        <>
          {/* Stats Bar */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
              <div className="stat-card" style={{ padding: '16px 20px' }}>
                <div className="stat-label">Total Users</div>
                <div className="stat-value" style={{ fontSize: 24 }}>{stats.users}</div>
              </div>
              <div className="stat-card" style={{ padding: '16px 20px' }}>
                <div className="stat-label">Workspaces</div>
                <div className="stat-value" style={{ fontSize: 24 }}>{stats.projects}</div>
              </div>
              <div className="stat-card" style={{ padding: '16px 20px' }}>
                <div className="stat-label">Total Runs</div>
                <div className="stat-value" style={{ fontSize: 24 }}>{stats.jobs}</div>
              </div>
              <div className="stat-card" style={{ padding: '16px 20px' }}>
                <div className="stat-label">Rows Generated</div>
                <div className="stat-value" style={{ fontSize: 24 }}>
                  {stats.totalRowsGenerated >= 1000 ? `${(stats.totalRowsGenerated / 1000).toFixed(0)}k` : stats.totalRowsGenerated}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="tabs" style={{ maxWidth: 450 }}>
            <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
              <Users size={14} style={{ display: 'inline', marginRight: 4 }} /> Users ({users.length})
            </button>
            <button className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>
              <Server size={14} style={{ display: 'inline', marginRight: 4 }} /> Jobs queue ({jobs.length})
            </button>
            <button className={`tab-btn ${activeTab === 'templates' ? 'active' : ''}`} onClick={() => setActiveTab('templates')}>
              <Database size={14} style={{ display: 'inline', marginRight: 4 }} /> Templates ({templates.length})
            </button>
          </div>

          {/* Tab Views */}
          <div className="glass" style={{ padding: 24, overflow: 'hidden' }}>
            {activeTab === 'users' && (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined Date</th>
                      <th style={{ width: 80 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id}>
                        <td>{u.name}</td>
                        <td style={{ textTransform: 'none' }}>{u.email}</td>
                        <td>
                          <span className={`badge ${u.role === 'admin' ? 'badge-danger' : 'badge-primary'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDeleteUser(u._id)}
                            style={{ color: 'var(--danger)', border: 'none', padding: 4 }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'jobs' && (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Job ID</th>
                      <th>User</th>
                      <th>Workspace</th>
                      <th>Total Rows</th>
                      <th>Generated</th>
                      <th>Status</th>
                      <th>Export</th>
                      <th>Run Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((j) => (
                      <tr key={j._id}>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>#{j._id.slice(-6)}</td>
                        <td>{j.userId ? j.userId.name : <span style={{ color: 'var(--text-muted)' }}>Deleted</span>}</td>
                        <td>{j.projectId ? j.projectId.name : <span style={{ color: 'var(--text-muted)' }}>Deleted</span>}</td>
                        <td>{j.rowsTotal}</td>
                        <td>{j.rowsGenerated}</td>
                        <td>
                          <span className={`badge ${j.status === 'completed' ? 'badge-success' : j.status === 'failed' ? 'badge-danger' : 'badge-warning'}`}>
                            {j.status}
                          </span>
                        </td>
                        <td>{j.exportFormat}</td>
                        <td>{new Date(j.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'templates' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>
                    Custom Marketplace Templates
                  </h3>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                    <Plus size={14} /> Add Template
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Template Name</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Usage Count</th>
                        <th style={{ width: 80 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {templates.map((t) => (
                        <tr key={t._id}>
                          <td>{t.name}</td>
                          <td>{t.description}</td>
                          <td>{t.category}</td>
                          <td>{t.usageCount}</td>
                          <td>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleDeleteTemplate(t._id)}
                              style={{ color: 'var(--danger)', border: 'none', padding: 4 }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Template Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal animate-fade-in" style={{ maxWidth: 640 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={20} color="var(--primary)" /> Add Marketplace Template
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddTemplateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="input-label">Template Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Ridesharing App Schema"
                    value={tName}
                    onChange={(e) => setTName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Category</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Transport"
                    value={tCat}
                    onChange={(e) => setTCat(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 12 }}>
                <div>
                  <label className="input-label">Emoji Icon</label>
                  <input
                    type="text"
                    className="input"
                    value={tIcon}
                    onChange={(e) => setTIcon(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Tags (comma-separated)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. transport, rides, drivers"
                    value={tTags}
                    onChange={(e) => setTTags(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Description</label>
                <textarea
                  className="input"
                  placeholder="Summarize the database structure..."
                  value={tDesc}
                  onChange={(e) => setTDesc(e.target.value)}
                  style={{ minHeight: 60, resize: 'vertical' }}
                  required
                />
              </div>

              <div>
                <label className="input-label">Schema JSON</label>
                <textarea
                  className="input"
                  value={tSchemaJson}
                  onChange={(e) => setTSchemaJson(e.target.value)}
                  style={{ minHeight: 180, fontFamily: 'var(--font-mono)', fontSize: 11, resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish to Marketplace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
