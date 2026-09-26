import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { marketplaceAPI, projectsAPI } from '../lib/api';
import { Download, Search, LayoutTemplate, Tag, Users, ShieldAlert, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

interface Template {
  _id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  tags: string[];
  usageCount: number;
}

export default function MarketplacePage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState('');
  const [importingId, setImportingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchTemplates = async () => {
    try {
      const res = await marketplaceAPI.list();
      setTemplates(res.data.templates || []);
      setFilteredTemplates(res.data.templates || []);
    } catch (err: any) {
      toast.error('Failed to load marketplace templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    const term = search.toLowerCase();
    const filtered = templates.filter(t =>
      t.name.toLowerCase().includes(term) ||
      t.description.toLowerCase().includes(term) ||
      t.category.toLowerCase().includes(term) ||
      t.tags.some(tag => tag.toLowerCase().includes(term))
    );
    setFilteredTemplates(filtered);
  }, [search, templates]);

  const handleImport = async (templateId: string) => {
    setImportingId(templateId);
    try {
      // 1. Fetch full template tables and edges
      const tempRes = await marketplaceAPI.get(templateId);
      const template = tempRes.data.template;

      if (!template) throw new Error('Template schema not found');

      // 2. Create a new project
      const projRes = await projectsAPI.create({
        name: `${template.name} Workspace`,
        description: template.description,
        tags: [...template.tags, 'imported'],
      });
      const newProject = projRes.data.project;

      // 3. Save the schema (tables and flowEdges) to the project
      await projectsAPI.update(newProject._id, {
        tables: template.tables,
        flowEdges: template.flowEdges,
        generationSettings: {
          rowsCount: 100,
          exportFormat: 'ZIP',
          edgeCases: {
            mutationPercentage: 0,
            mutations: {},
          },
        },
      });

      toast.success(`Imported "${template.name}" successfully!`);
      navigate(`/projects/${newProject._id}/editor`);
    } catch (err: any) {
      toast.error('Failed to import database template');
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800 }}>
          Schema Template Marketplace
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Browse and import industry-standard relational schemas for quick software environment mocks
        </p>
      </div>

      {/* Search and filter Toolbar */}
      <div style={{ position: 'relative', maxWidth: 400 }}>
        <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          className="input"
          placeholder="Filter by category, tags, description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 42 }}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {[1, 2, 3].map(n => (
            <div key={n} className="skeleton" style={{ height: 210, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="glass" style={{ padding: 64, textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <LayoutTemplate size={48} color="var(--text-muted)" />
          <div>
            <h3>No Templates Found</h3>
            <p style={{ fontSize: 13, marginTop: 4 }}>
              Try a different keyword or search filter.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {filteredTemplates.map(template => (
            <div
              key={template._id}
              className="glass-card animate-fade-in"
              style={{
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                minHeight: 220,
              }}
            >
              <div>
                {/* Title & Icon */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                  }}>
                    {template.icon || '🗄️'}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700 }}>{template.name}</h3>
                    <span className="badge badge-accent" style={{ fontSize: 9, padding: '1px 6px', marginTop: 2 }}>
                      {template.category}
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: 13, color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 16 }}>
                  {template.description}
                </p>
              </div>

              <div>
                {/* Tags */}
                {template.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    {template.tags.map(tag => (
                      <span key={tag} className="badge badge-primary" style={{ fontSize: 9, padding: '1px 8px' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Import actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={12} /> {template.usageCount} imports
                  </span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleImport(template._id)}
                    disabled={importingId !== null}
                    style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px' }}
                  >
                    {importingId === template._id ? 'Importing...' : (
                      <>
                        <Download size={13} /> Use Template
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
