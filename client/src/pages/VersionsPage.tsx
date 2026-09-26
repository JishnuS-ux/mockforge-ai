import { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, GitBranch, Plus, Play, RefreshCw, Copy, CheckCircle2, X } from 'lucide-react';
import { DatasetVersion } from '../../../shared/types';
import toast from 'react-hot-toast';

export default function VersionsPage() {
  const [showModal, setShowModal] = useState(false);
  const [versionTag, setVersionTag] = useState('');
  const [description, setDescription] = useState('');
  const [rowsCount, setRowsCount] = useState<number>(10000);
  const [copiedSeed, setCopiedSeed] = useState<number | null>(null);

  const [versions, setVersions] = useState<DatasetVersion[]>([
    {
      id: 'ver-1',
      projectId: 'proj-1',
      versionNumber: 1,
      versionTag: 'v1.0.0-seed',
      description: 'Initial benchmark dataset seed for E-Commerce app (10k records)',
      rowsCount: 10000,
      tablesCount: 6,
      seed: 42891,
      configSnapshot: { tables: [], settings: { rowsCount: 10000, edgeCases: { mutationPercentage: 5, mutations: {} }, exportFormat: 'CSV' } },
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'ver-2',
      projectId: 'proj-1',
      versionNumber: 2,
      versionTag: 'v1.1.0-edgecases',
      description: 'Added SQLi/XSS security test vectors and null boundary mutations',
      rowsCount: 50000,
      tablesCount: 6,
      seed: 88201,
      configSnapshot: { tables: [], settings: { rowsCount: 50000, edgeCases: { mutationPercentage: 15, mutations: {} }, exportFormat: 'ZIP' } },
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ]);

  const handleCopySeed = (seed: number) => {
    navigator.clipboard.writeText(String(seed));
    setCopiedSeed(seed);
    toast.success(`Copied seed hash #${seed} to clipboard!`);
    setTimeout(() => setCopiedSeed(null), 1500);
  };

  const handleReproduce = (ver: DatasetVersion) => {
    toast.loading(`Reproducing generation from seed #${ver.seed}...`, { duration: 1500 });
    setTimeout(() => {
      toast.success(`Successfully reproduced ${ver.rowsCount.toLocaleString()} deterministic records from seed #${ver.seed}!`);
    }, 1500);
  };

  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionTag) return toast.error('Version tag is required');

    const newVer: DatasetVersion = {
      id: `ver-${Date.now()}`,
      projectId: 'proj-1',
      versionNumber: versions.length + 1,
      versionTag,
      description: description || 'Dataset seed snapshot',
      rowsCount,
      tablesCount: 6,
      seed: Math.floor(Math.random() * 90000) + 10000,
      configSnapshot: { tables: [], settings: { rowsCount, edgeCases: { mutationPercentage: 10, mutations: {} }, exportFormat: 'ZIP' } },
      createdAt: new Date().toISOString(),
    };

    setVersions([newVer, ...versions]);
    toast.success(`Created dataset snapshot ${versionTag}!`);
    setShowModal(false);
    setVersionTag('');
    setDescription('');
  };

  return (
    <div style={{ padding: '28px 36px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, color: 'var(--text-primary)' }}>Dataset Versioning (Data-as-Code)</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            Track, reproduce, and compare historical synthetic dataset generation seeds and configuration snapshots.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            border: 'none',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 0 15px var(--primary-glow)',
            fontSize: 13,
          }}
        >
          <Plus size={16} /> Create Dataset Snapshot
        </button>
      </div>

      {/* Version History List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {versions.map((ver) => (
          <motion.div
            key={ver.id}
            whileHover={{ y: -2 }}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: 14,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'hsla(252,90%,66%,0.15)',
                    color: 'var(--primary-light)',
                    border: '1px solid hsla(252,90%,66%,0.3)',
                  }}
                >
                  {ver.versionTag}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Created {new Date(ver.createdAt).toLocaleDateString()} at {new Date(ver.createdAt).toLocaleTimeString()}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => handleCopySeed(ver.seed)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {copiedSeed === ver.seed ? <CheckCircle2 size={14} color="var(--success)" /> : <Copy size={14} />}
                  <span>Seed: {ver.seed}</span>
                </button>

                <button
                  onClick={() => handleReproduce(ver)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--accent)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  <Play size={14} /> Reproduce Generation
                </button>
              </div>
            </div>

            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              {ver.description}
            </div>

            <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'var(--text-muted)' }}>
              <div>Tables: <strong style={{ color: 'var(--text-primary)' }}>{ver.tablesCount}</strong></div>
              <div>Records: <strong style={{ color: 'var(--text-primary)' }}>{ver.rowsCount.toLocaleString()}</strong></div>
              <div>Format: <strong style={{ color: 'var(--text-primary)' }}>{ver.configSnapshot.settings.exportFormat}</strong></div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Snapshot Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal animate-fade-in" style={{ position: 'relative', maxWidth: 500 }}>
            <button
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', right: 24, top: 24, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
              Create Dataset Seed Snapshot
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Save a seed hash and schema snapshot to reproduce identical dataset outputs.
            </p>

            <form onSubmit={handleCreateSnapshot} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="input-label">Version Tag</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. v1.2.0-benchmark"
                  value={versionTag}
                  onChange={(e) => setVersionTag(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="input-label">Description</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Production load testing snapshot"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="input-label">Target Row Count</label>
                <input
                  type="number"
                  className="input"
                  value={rowsCount}
                  onChange={(e) => setRowsCount(Number(e.target.value))}
                  min={100}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Snapshot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
