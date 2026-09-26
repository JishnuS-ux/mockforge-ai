import { useEffect, useState } from 'react';
import { generatorAPI, projectsAPI } from '../lib/api';
import { Terminal, Download, Clock, Database, ChevronDown, ChevronUp, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface JobLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

interface Job {
  _id: string;
  projectId: string;
  projectName?: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  rowsTotal: number;
  rowsGenerated: number;
  exportPath?: string;
  exportFormat: string;
  createdAt: string;
  completedAt?: string;
  logs?: JobLog[];
  showLogs?: boolean;
}

export default function HistoryPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const res = await generatorAPI.listJobs();
      const rawJobs = res.data.jobs || [];

      // Fetch all projects to map names
      const projRes = await projectsAPI.list();
      const projects = projRes.data.projects || [];
      const projectMap = new Map(projects.map((p: any) => [p._id, p.name]));

      const mappedJobs = rawJobs.map((job: any) => ({
        ...job,
        projectName: projectMap.get(job.projectId) || 'Unknown Workspace',
        showLogs: false,
      }));

      setJobs(mappedJobs);
    } catch (err: any) {
      toast.error('Failed to load job history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const toggleLogs = async (jobId: string) => {
    // Check if logs are already loaded
    const job = jobs.find((j) => j._id === jobId);
    if (!job) return;

    if (job.showLogs) {
      setJobs((prev) => prev.map((j) => (j._id === jobId ? { ...j, showLogs: false } : j)));
      return;
    }

    try {
      // Fetch full job with logs
      const res = await generatorAPI.getJob(jobId);
      const fullJob = res.data.job;

      setJobs((prev) =>
        prev.map((j) =>
          j._id === jobId
            ? { ...j, logs: fullJob.logs || [], showLogs: true }
            : j
        )
      );
    } catch (err) {
      toast.error('Failed to fetch job execution logs');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span className="badge badge-success">Success</span>;
      case 'running':   return <span className="badge badge-warning animate-glow">Running</span>;
      case 'queued':    return <span className="badge badge-primary">Queued</span>;
      case 'failed':    return <span className="badge badge-danger">Failed</span>;
      default:          return <span className="badge badge-primary">{status}</span>;
    }
  };

  return (
    <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800 }}>
            Generation Run History
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Download generated datasets and review platform run reports
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchJobs}>
          <RefreshCw size={14} /> Refresh Logs
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2, 3].map(n => (
            <div key={n} className="skeleton" style={{ height: 70, borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass" style={{ padding: 64, textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <Terminal size={48} color="var(--text-muted)" />
          <div>
            <h3>No Run History</h3>
            <p style={{ fontSize: 13, marginTop: 4 }}>
              You haven't run any data generation tasks yet.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {jobs.map((job) => (
            <div
              key={job._id}
              className="glass"
              style={{
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '1px solid var(--border)',
              }}
            >
              {/* Job Row Header */}
              <div
                style={{
                  padding: '16px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-card)',
                  cursor: 'pointer',
                  flexWrap: 'wrap',
                  gap: 16,
                }}
                onClick={() => toggleLogs(job._id)}
              >
                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                  {/* Status icon */}
                  <div>
                    {getStatusBadge(job.status)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 600 }}>{job.projectName}</h3>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      ID: #{job._id.slice(-6)}
                    </span>
                  </div>
                </div>

                {/* Info block */}
                <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <Database size={14} /> {job.rowsGenerated} / {job.rowsTotal} rows
                  </span>

                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <Clock size={14} /> {new Date(job.createdAt).toLocaleString()}
                  </span>

                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                    {job.status === 'completed' && job.exportPath ? (
                      <a
                        href={job.exportPath}
                        download
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                      >
                        <Download size={12} /> Download ZIP
                      </a>
                    ) : (
                      <button className="btn btn-ghost btn-sm" disabled style={{ opacity: 0.5 }}>
                        Download ZIP
                      </button>
                    )}

                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => toggleLogs(job._id)}
                      style={{ padding: 8 }}
                    >
                      {job.showLogs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expandable Logs terminal */}
              {job.showLogs && (
                <div style={{ padding: 20, background: 'hsl(220, 25%, 3%)', borderTop: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Terminal size={12} /> Run Process Logs
                  </h4>
                  <div className="log-terminal" style={{ maxHeight: 200 }}>
                    {!job.logs || job.logs.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)' }}>No logs captured for this job.</div>
                    ) : (
                      job.logs.map((log, idx) => {
                        const cls = log.level === 'error' ? 'log-error' : log.level === 'warn' ? 'log-warn' : 'log-info';
                        return (
                          <div key={idx} className={cls} style={{ marginBottom: 4 }}>
                            [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
