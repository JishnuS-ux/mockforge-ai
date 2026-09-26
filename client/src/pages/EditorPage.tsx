import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { projectsAPI, generatorAPI, assistantAPI } from '../lib/api';
import { useSocket } from '../lib/socket';
import TableNode from '../components/TableNode';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Sparkles, Play, Eye, Settings, MessageSquare, Plus, Trash2, X, Key,
  Link2, Check, Download, AlertCircle, RefreshCw, Send, Terminal, Loader2, Info
} from 'lucide-react';

const nodeTypes = {
  tableNode: TableNode,
};

function Editor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Project state
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // React Flow states
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Selected states
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  // AI Prompt generator state
  const [promptText, setPromptText] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  // AI Chat assistant state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, any[]>>({});
  const [activePreviewTab, setActivePreviewTab] = useState<string>('');

  // Generation Modal state
  const [genOpen, setGenOpen] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState(0);
  const [jobStatus, setJobStatus] = useState<string>('');
  const [jobSpeed, setJobSpeed] = useState(0);
  const [jobTimeRemaining, setJobTimeRemaining] = useState(0);
  const [jobLogs, setJobLogs] = useState<Array<{ timestamp: string; level: 'info' | 'warn' | 'error'; message: string }>>([]);
  const [jobExportPath, setJobExportPath] = useState<string | null>(null);

  // Sidebar settings state (collapsible options panel)
  const [showProjectSettings, setShowProjectSettings] = useState(false);

  // Field editor state
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [showConstraintsModal, setShowConstraintsModal] = useState<string | null>(null); // field ID

  // Fetch project schema
  const fetchProject = async () => {
    try {
      const res = await projectsAPI.get(id!);
      const proj = res.data.project;
      setProject(proj);

      // Map tables to React Flow nodes
      const initialNodes = proj.tables.map((table: any) => ({
        id: table.id,
        type: 'tableNode',
        position: table.position || { x: Math.random() * 300, y: Math.random() * 300 },
        data: { table },
      }));
      setNodes(initialNodes);

      // Map edges to React Flow edges
      const initialEdges = (proj.flowEdges || []).map((edge: any) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle || 'output',
        targetHandle: edge.targetHandle || 'input',
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary)' },
        animated: true,
      }));
      setEdges(initialEdges);
    } catch (err: any) {
      toast.error('Failed to load project schema');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  // Scroll chat assistant to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // Handle saving project
  const saveProject = async (updatedProject = project) => {
    if (!updatedProject) return;
    setSaving(true);
    try {
      // Map node positions back to project tables
      const finalTables = updatedProject.tables.map((t: any) => {
        const matchingNode = nodes.find((n) => n.id === t.id);
        return {
          ...t,
          position: matchingNode ? matchingNode.position : t.position,
        };
      });

      // Save flow edges
      const finalEdges = edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      }));

      const payload = {
        ...updatedProject,
        tables: finalTables,
        flowEdges: finalEdges,
      };

      await projectsAPI.update(id!, payload);
      setProject(payload);
    } catch (err: any) {
      toast.error('Failed to save project changes');
    } finally {
      setSaving(false);
    }
  };

  // Node position drag listener
  const onNodeDragStop = useCallback(() => {
    saveProject();
  }, [nodes, edges, project]);

  // Connect tables via drag handles
  const onConnect = useCallback(
    (connection: Connection) => {
      const edgeId = `e-${connection.source}-${connection.target}`;
      const newEdge = {
        ...connection,
        id: edgeId,
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary)' },
        animated: true,
      };
      setEdges((eds) => addEdge(newEdge, eds));

      // Intelligent mapping: automatically add FK in target table referencing source table's PK
      if (project) {
        const sourceTable = project.tables.find((t: any) => t.id === connection.source);
        const targetTable = project.tables.find((t: any) => t.id === connection.target);

        if (sourceTable && targetTable) {
          const pkField = sourceTable.fields.find((f: any) => f.isPrimaryKey);
          if (pkField) {
            const fkFieldName = `${sourceTable.name}_${pkField.name}`;
            const fkExists = targetTable.fields.some((f: any) => f.isForeignKey && f.referencesTable === sourceTable.id);

            if (!fkExists) {
              const newFkField = {
                id: `f-${Math.random().toString(36).substr(2, 9)}`,
                name: fkFieldName,
                type: pkField.type,
                isPrimaryKey: false,
                isForeignKey: true,
                referencesTable: sourceTable.id,
                referencesField: pkField.name,
                constraints: { nullable: false },
              };

              const updatedTables = project.tables.map((t: any) => {
                if (t.id === targetTable.id) {
                  return { ...t, fields: [...t.fields, newFkField] };
                }
                return t;
              });

              const updatedProj = { ...project, tables: updatedTables };
              setProject(updatedProj);
              toast.success(`Linked! Added foreign key "${fkFieldName}" in table "${targetTable.name}"`);

              // Update React Flow nodes immediately
              setNodes((prevNodes) =>
                prevNodes.map((n) => {
                  if (n.id === targetTable.id) {
                    return {
                      ...n,
                      data: {
                        ...n.data,
                        table: { ...targetTable, fields: [...targetTable.fields, newFkField] },
                      },
                    };
                  }
                  return n;
                })
              );

              // Deferred save
              setTimeout(() => saveProject(updatedProj), 100);
            }
          }
        }
      }
    },
    [project, nodes]
  );

  // Generate schema using AI prompt
  const handleAiSchemaGenerate = async () => {
    if (!promptText) return toast.error('Please enter a schema description');
    setAiGenerating(true);
    try {
      const res = await projectsAPI.generateSchema(id!, promptText);
      toast.success('Database schema generated successfully!');
      setPromptText('');
      fetchProject(); // Reload editor pages, nodes, and edges
    } catch (err: any) {
      toast.error('AI schema generation failed. Try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  // Add a new blank table
  const handleAddTable = () => {
    const tableId = `t-${Math.random().toString(36).substr(2, 9)}`;
    const tableName = `table_${project.tables.length + 1}`;
    const newTable = {
      id: tableId,
      name: tableName,
      rowsCount: 100,
      fields: [
        {
          id: `f-${Math.random().toString(36).substr(2, 9)}`,
          name: 'id',
          type: 'UUID',
          isPrimaryKey: true,
          isForeignKey: false,
          constraints: { unique: true, nullable: false },
        },
      ],
      position: { x: 250, y: 150 },
    };

    const updatedProj = {
      ...project,
      tables: [...project.tables, newTable],
    };

    setProject(updatedProj);
    setNodes((prev) => [
      ...prev,
      {
        id: tableId,
        type: 'tableNode',
        position: newTable.position,
        data: { table: newTable },
      },
    ]);
    setSelectedTableId(tableId);
    setShowProjectSettings(false);
    saveProject(updatedProj);
  };

  // Delete a table
  const handleDeleteTable = (tableId: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;
    const updatedTables = project.tables.filter((t: any) => t.id !== tableId);
    // Remove connected edges
    const updatedEdges = edges.filter((e) => e.source !== tableId && e.target !== tableId);

    const updatedProj = { ...project, tables: updatedTables };
    setProject(updatedProj);
    setNodes((prev) => prev.filter((n) => n.id !== tableId));
    setEdges(updatedEdges);
    setSelectedTableId(null);
    saveProject(updatedProj);
  };

  // Quick Preview
  const handleQuickPreview = async () => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    try {
      const res = await projectsAPI.preview(id!);
      setPreviewData(res.data.preview || {});
      const keys = Object.keys(res.data.preview || {});
      if (keys.length > 0) setActivePreviewTab(keys[0]);
    } catch (err: any) {
      toast.error('Failed to generate mock preview');
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Start actual data generation job
  const handleStartGeneration = async () => {
    try {
      setGenOpen(true);
      setJobStatus('queued');
      setJobProgress(0);
      setJobSpeed(0);
      setJobTimeRemaining(0);
      setJobLogs([]);
      setJobExportPath(null);

      const res = await generatorAPI.start(id!);
      setActiveJobId(res.data.jobId);
    } catch (err: any) {
      toast.error('Failed to queue data generation job');
      setGenOpen(false);
    }
  };

  // Live updates from socket
  useSocket({
    'job:update': (data: any) => {
      if (data.jobId === activeJobId) {
        setJobStatus(data.status || 'running');
        setJobProgress(data.progress || 0);
        if (data.speed) setJobSpeed(data.speed);
        if (data.timeRemaining) setJobTimeRemaining(data.timeRemaining);
        if (data.message) {
          setJobLogs((prev) => [
            ...prev,
            { timestamp: new Date().toISOString(), level: 'info', message: data.message },
          ]);
        }
      }
    },
    'job:complete': (data: any) => {
      if (data.jobId === activeJobId) {
        setJobStatus('completed');
        setJobProgress(100);
        setJobExportPath(data.exportPath);
        setJobLogs((prev) => [
          ...prev,
          { timestamp: new Date().toISOString(), level: 'info', message: '🎉 Job completed successfully!' },
        ]);
        toast.success('Generation complete!');
      }
    },
    'job:error': (data: any) => {
      if (data.jobId === activeJobId) {
        setJobStatus('failed');
        setJobLogs((prev) => [
          ...prev,
          { timestamp: new Date().toISOString(), level: 'error', message: `❌ Error: ${data.error}` },
        ]);
        toast.error(`Generation failed: ${data.error}`);
      }
    },
  }, [activeJobId]);

  // Fetch job details to retrieve logs from DB on change
  useEffect(() => {
    let interval: any;
    if (genOpen && activeJobId && (jobStatus === 'running' || jobStatus === 'queued')) {
      const fetchLogs = async () => {
        try {
          const res = await generatorAPI.getJob(activeJobId!);
          if (res.data.job && res.data.job.logs) {
            setJobLogs(res.data.job.logs);
          }
        } catch {}
      };
      interval = setInterval(fetchLogs, 2000);
    }
    return () => clearInterval(interval);
  }, [genOpen, activeJobId, jobStatus]);

  // AI assistant chat submission
  const handleChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    try {
      const res = await assistantAPI.chat(userMsg, chatMessages);
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.data.reply,
          confirmationPlan: res.data.confirmationPlan,
        },
      ]);
    } catch (err: any) {
      toast.error('Failed to get response');
    } finally {
      setChatLoading(false);
    }
  };

  // Modify table info
  const updateTableInfo = (tableId: string, updates: any) => {
    const updatedTables = project.tables.map((t: any) => {
      if (t.id === tableId) {
        const u = { ...t, ...updates };
        // Update nodes too
        setNodes((prevNodes) =>
          prevNodes.map((n) => (n.id === tableId ? { ...n, data: { ...n.data, table: u } } : n))
        );
        return u;
      }
      return t;
    });

    const updatedProj = { ...project, tables: updatedTables };
    setProject(updatedProj);
    saveProject(updatedProj);
  };

  // Fields and constraints update helpers
  const handleAddField = (tableId: string) => {
    const fieldId = `f-${Math.random().toString(36).substr(2, 9)}`;
    const newField = {
      id: fieldId,
      name: `field_${Math.random().toString(36).substr(2, 4)}`,
      type: 'Text',
      isPrimaryKey: false,
      isForeignKey: false,
      constraints: { nullable: true },
    };

    const updatedTables = project.tables.map((t: any) => {
      if (t.id === tableId) {
        const fields = [...t.fields, newField];
        // update React Flow nodes
        setNodes((prevNodes) =>
          prevNodes.map((n) => (n.id === tableId ? { ...n, data: { ...n.data, table: { ...t, fields } } } : n))
        );
        return { ...t, fields };
      }
      return t;
    });

    const updatedProj = { ...project, tables: updatedTables };
    setProject(updatedProj);
    saveProject(updatedProj);
    setEditingFieldId(fieldId);
  };

  const handleUpdateField = (tableId: string, fieldId: string, fieldUpdates: any) => {
    const updatedTables = project.tables.map((t: any) => {
      if (t.id === tableId) {
        const fields = t.fields.map((f: any) => {
          if (f.id === fieldId) {
            const updatedField = { ...f, ...fieldUpdates };
            // Clear reference metadata if FK is unchecked
            if (fieldUpdates.isForeignKey === false) {
              delete updatedField.referencesTable;
              delete updatedField.referencesField;
            }
            return updatedField;
          }
          return f;
        });

        // Sync node
        setNodes((prevNodes) =>
          prevNodes.map((n) => (n.id === tableId ? { ...n, data: { ...n.data, table: { ...t, fields } } } : n))
        );
        return { ...t, fields };
      }
      return t;
    });

    const updatedProj = { ...project, tables: updatedTables };
    setProject(updatedProj);
    saveProject(updatedProj);
  };

  const handleDeleteField = (tableId: string, fieldId: string) => {
    const updatedTables = project.tables.map((t: any) => {
      if (t.id === tableId) {
        const fields = t.fields.filter((f: any) => f.id !== fieldId);
        // Sync node
        setNodes((prevNodes) =>
          prevNodes.map((n) => (n.id === tableId ? { ...n, data: { ...n.data, table: { ...t, fields } } } : n))
        );
        return { ...t, fields };
      }
      return t;
    });

    const updatedProj = { ...project, tables: updatedTables };
    setProject(updatedProj);
    saveProject(updatedProj);
    if (editingFieldId === fieldId) setEditingFieldId(null);
  };

  // Constraints editor
  const handleUpdateConstraints = (tableId: string, fieldId: string, constraintsUpdates: any) => {
    const updatedTables = project.tables.map((t: any) => {
      if (t.id === tableId) {
        const fields = t.fields.map((f: any) => {
          if (f.id === fieldId) {
            return {
              ...f,
              constraints: {
                ...f.constraints,
                ...constraintsUpdates,
              },
            };
          }
          return f;
        });
        return { ...t, fields };
      }
      return t;
    });

    const updatedProj = { ...project, tables: updatedTables };
    setProject(updatedProj);
    saveProject(updatedProj);
  };

  const getSelectedTable = () => {
    if (!project) return null;
    return project.tables.find((t: any) => t.id === selectedTableId) || null;
  };

  const selectedTable = getSelectedTable();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* ─── Editor Header ────────────────────────────────────────────────── */}
      <header
        style={{
          height: 64,
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')} style={{ padding: 8 }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                {loading ? 'Loading workspace...' : project?.name}
              </h2>
              {saving && <Loader2 size={14} className="animate-spin-slow" color="var(--text-muted)" />}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Schema Visual Modeler & Synthetic Testing
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setChatOpen(!chatOpen)}>
            <MessageSquare size={14} /> AI Assistant
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleQuickPreview} disabled={loading || project?.tables.length === 0}>
            <Eye size={14} /> Preview
          </button>
          <button
            className={`btn btn-sm ${showProjectSettings ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => {
              setShowProjectSettings(!showProjectSettings);
              setSelectedTableId(null);
            }}
          >
            <Settings size={14} /> Settings
          </button>
          <button
            className="btn btn-accent btn-sm"
            onClick={handleStartGeneration}
            disabled={loading || project?.tables.length === 0}
            style={{ fontWeight: 700 }}
          >
            <Play size={14} fill="#000" /> Generate Data
          </button>
        </div>
      </header>

      {/* ─── Workspace Layout ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Left Panel (AI generator and lists) */}
        <aside
          style={{
            width: 280,
            borderRight: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          {/* AI schema generator prompt input */}
          <div style={{ padding: 18, borderBottom: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={12} color="var(--primary)" /> AI Schema Generator
            </h4>
            <textarea
              className="input"
              placeholder="e.g. Generate a database schema for an online library booking portal..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              style={{ minHeight: 90, fontSize: 12, marginBottom: 10, resize: 'none' }}
              disabled={aiGenerating}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={handleAiSchemaGenerate}
              style={{ width: '100%', fontSize: 12 }}
              disabled={aiGenerating}
            >
              {aiGenerating ? (
                <>
                  <Loader2 size={12} className="animate-spin-slow" /> Generating...
                </>
              ) : (
                <>
                  <Sparkles size={12} /> Prompt Gemini AI
                </>
              )}
            </button>
          </div>

          {/* Tables List */}
          <div style={{ flex: 1, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}>
                Database Tables ({project?.tables?.length || 0})
              </h4>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleAddTable}
                style={{ padding: '2px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Plus size={12} /> Add Table
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {project?.tables?.map((t: any) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTableId(t.id);
                    setShowProjectSettings(false);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: selectedTableId === t.id ? 'var(--bg-elevated)' : 'transparent',
                    border: selectedTableId === t.id ? '1px solid var(--border-strong)' : '1px solid transparent',
                    fontSize: 13,
                    fontFamily: 'var(--font-mono)',
                    color: selectedTableId === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <span>{t.name}</span>
                  <span className="badge badge-accent" style={{ fontSize: 9 }}>{t.fields.length} cols</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Center Canvas (React Flow editor) */}
        <main style={{ flex: 1, height: '100%', position: 'relative' }}>
          {loading ? (
            <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-base)', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
              <Loader2 size={32} className="animate-spin-slow" color="var(--primary)" />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading schema canvas...</span>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={(changes) => {
                onNodesChange(changes);
              }}
              onEdgesChange={onEdgesChange}
              onNodeDragStop={onNodeDragStop}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              onSelectionChange={({ nodes: selectedNodes }) => {
                if (selectedNodes.length > 0) {
                  setSelectedTableId(selectedNodes[0].id);
                  setShowProjectSettings(false);
                }
              }}
            >
              <Background gap={16} size={1} color="rgba(255,255,255,0.06)" />
              <Controls showInteractive={false} style={{ left: 16, bottom: 16 }} />
            </ReactFlow>
          )}
        </main>

        {/* Right Panel (Table Editor or Project Settings) */}
        {(selectedTable || showProjectSettings) && (
          <aside
            style={{
              width: 320,
              borderLeft: '1px solid var(--border)',
              background: 'var(--bg-surface)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            {selectedTable && (
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>
                    Table Configuration
                  </h3>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDeleteTable(selectedTable.id)}
                    style={{ padding: 6, display: 'flex' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Table details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label className="input-label">Table Name</label>
                    <input
                      type="text"
                      className="input"
                      value={selectedTable.name}
                      onChange={(e) => updateTableInfo(selectedTable.id, { name: e.target.value })}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    />
                  </div>

                  <div>
                    <label className="input-label">Generate Rows Count</label>
                    <input
                      type="number"
                      className="input"
                      value={selectedTable.rowsCount}
                      onChange={(e) => updateTableInfo(selectedTable.id, { rowsCount: parseInt(e.target.value, 10) || 10 })}
                      min="10"
                      max="1000000"
                    />
                  </div>

                  <div>
                    <label className="input-label">Statistical Constraints Context</label>
                    <textarea
                      className="input"
                      placeholder="e.g. Employee ages 22-60 only, Indian phone numbers..."
                      value={selectedTable.statisticalContext || ''}
                      onChange={(e) => updateTableInfo(selectedTable.id, { statisticalContext: e.target.value })}
                      style={{ minHeight: 60, fontSize: 12, resize: 'vertical' }}
                    />
                  </div>
                </div>

                {/* Fields Editor */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}>
                      Table Schema Fields
                    </h4>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleAddField(selectedTable.id)}
                      style={{ padding: '2px 8px', fontSize: 11 }}
                    >
                      <Plus size={12} /> Add Field
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {selectedTable.fields?.map((field: any) => (
                      <div
                        key={field.id}
                        style={{
                          padding: 12,
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                            {field.name}
                          </span>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn btn-sm btn-ghost"
                              onClick={() => setEditingFieldId(editingFieldId === field.id ? null : field.id)}
                              style={{ padding: '2px 6px', fontSize: 10 }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-ghost"
                              onClick={() => handleDeleteField(selectedTable.id, field.id)}
                              style={{ padding: '2px 6px', fontSize: 10, color: 'var(--danger)' }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {editingFieldId === field.id && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, borderTop: '1px dashed var(--border)', paddingTop: 8 }}>
                            <div>
                              <label className="input-label" style={{ fontSize: 11 }}>Field Name</label>
                              <input
                                type="text"
                                className="input"
                                value={field.name}
                                onChange={(e) => handleUpdateField(selectedTable.id, field.id, { name: e.target.value })}
                                style={{ fontSize: 12, padding: '6px 10px', fontFamily: 'var(--font-mono)' }}
                              />
                            </div>

                            <div>
                              <label className="input-label" style={{ fontSize: 11 }}>Data Type</label>
                              <select
                                className="input"
                                value={field.type}
                                onChange={(e) => handleUpdateField(selectedTable.id, field.id, { type: e.target.value })}
                                style={{ fontSize: 12, padding: '6px 10px' }}
                              >
                                {['UUID', 'Text', 'Name', 'Email', 'Phone', 'Address', 'Number', 'Decimal', 'Boolean', 'Date', 'DateTime', 'Custom'].map((t) => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            </div>

                            {/* Key toggles */}
                            <div style={{ display: 'flex', gap: 12, margin: '4px 0' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={field.isPrimaryKey}
                                  onChange={(e) => handleUpdateField(selectedTable.id, field.id, { isPrimaryKey: e.target.checked })}
                                />
                                <Key size={10} color="var(--warning)" /> PK
                              </label>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={field.isForeignKey}
                                  onChange={(e) => handleUpdateField(selectedTable.id, field.id, { isForeignKey: e.target.checked })}
                                />
                                <Link2 size={10} color="var(--accent)" /> FK
                              </label>
                            </div>

                            {field.isForeignKey && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--bg-surface)', padding: 8, borderRadius: 4 }}>
                                <div>
                                  <label className="input-label" style={{ fontSize: 10 }}>References Table</label>
                                  <select
                                    className="input"
                                    value={field.referencesTable || ''}
                                    onChange={(e) => handleUpdateField(selectedTable.id, field.id, { referencesTable: e.target.value })}
                                    style={{ fontSize: 11, padding: 4 }}
                                  >
                                    <option value="">-- select table --</option>
                                    {project.tables.filter((t: any) => t.id !== selectedTable.id).map((t: any) => (
                                      <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="input-label" style={{ fontSize: 10 }}>References Field</label>
                                  <select
                                    className="input"
                                    value={field.referencesField || ''}
                                    onChange={(e) => handleUpdateField(selectedTable.id, field.id, { referencesField: e.target.value })}
                                    style={{ fontSize: 11, padding: 4 }}
                                  >
                                    <option value="">-- select field --</option>
                                    {project.tables
                                      .find((t: any) => t.id === field.referencesTable)
                                      ?.fields.map((f: any) => (
                                        <option key={f.id} value={f.name}>{f.name}</option>
                                      ))}
                                  </select>
                                </div>
                              </div>
                            )}

                            {/* Constraints button */}
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => setShowConstraintsModal(field.id)}
                              style={{ width: '100%', fontSize: 11, padding: 6 }}
                            >
                              Configure Constraints
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {showProjectSettings && (
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>
                  Project Settings & Anomalies
                </h3>

                {/* Export Format */}
                <div>
                  <label className="input-label">Packaging Export Format</label>
                  <select
                    className="input"
                    value={project.generationSettings?.exportFormat || 'ZIP'}
                    onChange={(e) => {
                      const updated = {
                        ...project,
                        generationSettings: {
                          ...project.generationSettings,
                          exportFormat: e.target.value,
                        },
                      };
                      setProject(updated);
                      saveProject(updated);
                    }}
                  >
                    {['CSV', 'JSON', 'SQL', 'EXCEL', 'ZIP'].map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                {/* Mutation Rate */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label className="input-label" style={{ marginBottom: 0 }}>Edge Case Mutation Rate</label>
                    <span className="badge badge-warning" style={{ fontSize: 10 }}>
                      {project.generationSettings?.edgeCases?.mutationPercentage || 0}%
                    </span>
                  </div>
                  <input
                    type="range"
                    className="slider"
                    min="0"
                    max="100"
                    value={project.generationSettings?.edgeCases?.mutationPercentage || 0}
                    onChange={(e) => {
                      const updated = {
                        ...project,
                        generationSettings: {
                          ...project.generationSettings,
                          edgeCases: {
                            ...project.generationSettings.edgeCases,
                            mutationPercentage: parseInt(e.target.value, 10),
                          },
                        },
                      };
                      setProject(updated);
                      saveProject(updated);
                    }}
                  />
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Mutates generated mock records with testing anomalies.
                  </p>
                </div>

                {/* Mutation switches */}
                {project.generationSettings?.edgeCases?.mutationPercentage > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--bg-elevated)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', marginBottom: 4 }}>
                      Mutation Types
                    </span>
                    {[
                      { id: 'injectNulls', label: 'Inject Null Values' },
                      { id: 'injectNaNs', label: 'Inject NaN Strings' },
                      { id: 'injectNegatives', label: 'Negative Numbers' },
                      { id: 'injectHugeNumbers', label: 'Out of Bound Ints' },
                      { id: 'injectXSS', label: 'XSS Injection Payloads' },
                      { id: 'injectSQLi', label: 'SQL Injection Payloads' },
                      { id: 'injectBrokenJSON', label: 'Malformed JSON Strings' },
                      { id: 'injectDuplicatePKs', label: 'Duplicate Primary Keys' },
                      { id: 'injectExpiredDates', label: 'Expired/Past Dates' },
                      { id: 'injectFutureDates', label: 'Far-Future Dates' },
                      { id: 'injectInvalidPhones', label: 'Malformed Phone numbers' },
                      { id: 'injectInvalidEmails', label: 'Invalid Email Addresses' },
                    ].map((mut) => (
                      <label key={mut.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, cursor: 'pointer' }}>
                        <span>{mut.label}</span>
                        <div className="toggle">
                          <input
                            type="checkbox"
                            checked={project.generationSettings?.edgeCases?.mutations?.[mut.id] || false}
                            onChange={(e) => {
                              const updated = {
                                ...project,
                                generationSettings: {
                                  ...project.generationSettings,
                                  edgeCases: {
                                    ...project.generationSettings.edgeCases,
                                    mutations: {
                                      ...project.generationSettings.edgeCases.mutations,
                                      [mut.id]: e.target.checked,
                                    },
                                  },
                                },
                              };
                              setProject(updated);
                              saveProject(updated);
                            }}
                          />
                          <span className="toggle-track" />
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ─── Field Constraints Configuration Modal ─────────────────────── */}
      {showConstraintsModal && (() => {
        const field = selectedTable.fields.find((f: any) => f.id === showConstraintsModal);
        if (!field) return null;

        return (
          <div className="modal-overlay">
            <div className="modal animate-fade-in" style={{ maxWidth: 440 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800 }}>
                  Constraints: {field.name}
                </h3>
                <button
                  onClick={() => setShowConstraintsModal(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={field.constraints?.nullable ?? false}
                    onChange={(e) => handleUpdateConstraints(selectedTable.id, field.id, { nullable: e.target.checked })}
                  />
                  <span>Nullable (Allows NULL values in database)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={field.constraints?.unique ?? false}
                    onChange={(e) => handleUpdateConstraints(selectedTable.id, field.id, { unique: e.target.checked })}
                  />
                  <span>Unique Constraint (No duplicate values allowed)</span>
                </label>

                {(field.type === 'Number' || field.type === 'Decimal') && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="input-label">Min Value</label>
                      <input
                        type="number"
                        className="input"
                        value={field.constraints?.min ?? ''}
                        onChange={(e) => handleUpdateConstraints(selectedTable.id, field.id, { min: parseFloat(e.target.value) || undefined })}
                      />
                    </div>
                    <div>
                      <label className="input-label">Max Value</label>
                      <input
                        type="number"
                        className="input"
                        value={field.constraints?.max ?? ''}
                        onChange={(e) => handleUpdateConstraints(selectedTable.id, field.id, { max: parseFloat(e.target.value) || undefined })}
                      />
                    </div>
                  </div>
                )}

                {field.type === 'Custom' && (
                  <div>
                    <label className="input-label">Enum Options (comma-separated)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Small, Medium, Large"
                      value={field.constraints?.options?.join(', ') || ''}
                      onChange={(e) => handleUpdateConstraints(selectedTable.id, field.id, { options: e.target.value.split(',').map(o => o.trim()).filter(Boolean) })}
                    />
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      Forces generator to randomly pick only from these listed string options.
                    </p>
                  </div>
                )}
              </div>

              <button
                className="btn btn-primary"
                onClick={() => setShowConstraintsModal(null)}
                style={{ width: '100%', marginTop: 24 }}
              >
                <Check size={16} /> Save Constraints
              </button>
            </div>
          </div>
        );
      })()}

      {/* ─── Data Preview Modal ─────────────────────────────────────────── */}
      {previewOpen && (
        <div className="modal-overlay">
          <div className="modal animate-fade-in" style={{ maxWidth: '80vw', width: 900 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={20} color="var(--accent)" /> Generated Mock Preview
              </h3>
              <button
                onClick={() => setPreviewOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {previewLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 40 }}>
                <Loader2 className="animate-spin-slow" color="var(--accent)" size={28} />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Generating preview data samples...</span>
              </div>
            ) : Object.keys(previewData).length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                No preview data generated.
              </div>
            ) : (
              <div>
                {/* Tabs */}
                <div className="tabs" style={{ marginBottom: 16, overflowX: 'auto' }}>
                  {Object.keys(previewData).map((tblName) => (
                    <button
                      key={tblName}
                      className={`tab-btn ${activePreviewTab === tblName ? 'active' : ''}`}
                      onClick={() => setActivePreviewTab(tblName)}
                    >
                      {tblName}
                    </button>
                  ))}
                </div>

                {/* Table Data */}
                <div style={{ overflowX: 'auto', maxHeight: 350, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        {previewData[activePreviewTab]?.[0] && Object.keys(previewData[activePreviewTab][0]).map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData[activePreviewTab]?.map((row, idx) => (
                        <tr key={idx}>
                          {Object.values(row).map((v: any, cidx) => (
                            <td key={cidx}>{v === null ? 'NULL' : String(v)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Generation Log Console Modal ────────────────────────────── */}
      {genOpen && (
        <div className="modal-overlay">
          <div className="modal animate-fade-in" style={{ maxWidth: 540 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Terminal size={18} color="var(--primary)" /> DataForge Generation Engine
              </h3>
              {jobStatus !== 'running' && jobStatus !== 'queued' && (
                <button
                  onClick={() => setGenOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>Status: <span style={{ color: jobStatus === 'completed' ? 'var(--success)' : jobStatus === 'failed' ? 'var(--danger)' : 'var(--warning)' }}>{jobStatus}</span></span>
                {jobStatus === 'running' && jobSpeed > 0 && (
                  <span>Speed: <strong style={{ color: 'var(--accent)' }}>{jobSpeed} rows/s</strong></span>
                )}
              </div>

              {/* Progress bar */}
              <div>
                <div className="progress-track" style={{ marginBottom: 6 }}>
                  <div className="progress-fill" style={{ width: `${jobProgress}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>{jobProgress}% complete</span>
                  {jobStatus === 'running' && jobTimeRemaining > 0 && (
                    <span>Est. {jobTimeRemaining}s remaining</span>
                  )}
                </div>
              </div>

              {/* Log terminal */}
              <div className="log-terminal">
                {jobLogs.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)' }}>Waiting for logs...</div>
                ) : (
                  jobLogs.map((log, idx) => {
                    const cls = log.level === 'error' ? 'log-error' : log.level === 'warn' ? 'log-warn' : 'log-info';
                    return (
                      <div key={idx} className={cls} style={{ marginBottom: 4 }}>
                        [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Download actions */}
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                {jobStatus === 'completed' && jobExportPath && (
                  <a
                    href={jobExportPath}
                    download
                    className="btn btn-primary"
                    style={{ flex: 1, textDecoration: 'none' }}
                  >
                    <Download size={16} /> Download {project.generationSettings?.exportFormat || 'ZIP'} Package
                  </a>
                )}
                {jobStatus === 'failed' && (
                  <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleStartGeneration}>
                    <RefreshCw size={16} /> Retry Run
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setGenOpen(false)}
                  disabled={jobStatus === 'running' || jobStatus === 'queued'}
                  style={{ flex: jobStatus === 'completed' || jobStatus === 'failed' ? '0' : '1' }}
                >
                  Close Console
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── AI Assistant Drawer Sidebar ─────────────────────────────── */}
      {chatOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 64,
            bottom: 0,
            width: 360,
            background: 'var(--bg-surface)',
            borderLeft: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 40,
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={16} color="var(--primary)" /> DataForge AI Assistant
            </h3>
            <button
              onClick={() => setChatOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ flex: 1, padding: 18, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 10, background: 'var(--bg-elevated)', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)' }}>
              <Info size={18} style={{ flexShrink: 0 }} />
              <span>Ask about foreign keys, schema normalization, edge case injections, or synthetic data design constraints.</span>
            </div>

            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-elevated)',
                  border: msg.role === 'user' ? '1px solid var(--primary-glow)' : '1px solid var(--border)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                  padding: '8px 14px',
                  borderRadius: msg.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                  fontSize: 12,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.content}
              </div>
            ))}
            {chatLoading && (
              <div style={{ alignSelf: 'flex-start', background: 'var(--bg-elevated)', padding: '8px 14px', borderRadius: '12px 12px 12px 0', fontSize: 12, border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                Thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleChatSend} style={{ padding: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input
              type="text"
              className="input"
              placeholder="Ask Assistant a question..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              style={{ fontSize: 12 }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: 10 }}>
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function EditorPage() {
  return (
    <ReactFlowProvider>
      <Editor />
    </ReactFlowProvider>
  );
}
