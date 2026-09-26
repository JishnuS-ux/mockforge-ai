import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2, Database, Zap, Cpu, X, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingWizard({ isOpen, onClose }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Welcome to MockForge AI 2.0',
      subtitle: 'Autonomous AI Synthetic Data & Software Testing Platform',
      icon: Sparkles,
      content: (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
            MockForge AI enables developers and QA automation engineers to understand database schemas, infer business rules, generate production-like synthetic environments, build smart edge cases, and run API tests — all from one intelligent workspace.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 24 }}>
            <div style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <Database size={24} color="var(--primary-light)" style={{ marginBottom: 8 }} />
              <div style={{ fontWeight: 600, fontSize: 13 }}>Smart Schemas</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>AI semantic field & domain detection</div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <Zap size={24} color="var(--accent)" style={{ marginBottom: 8 }} />
              <div style={{ fontWeight: 600, fontSize: 13 }}>Edge Case Studio</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Boundary & security test payload generation</div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <Cpu size={24} color="var(--violet)" style={{ marginBottom: 8 }} />
              <div style={{ fontWeight: 600, fontSize: 13 }}>Data Quality Audit</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Distribution anomaly & integrity checks</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Step 1: Create or Import a Project',
      subtitle: 'Organize your relational database schemas',
      icon: Database,
      content: (
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          <p style={{ marginBottom: 16 }}>
            Start by creating a workspace project or importing pre-built domain templates (Banking, E-Commerce, Healthcare, University, Food Delivery).
          </p>
          <div
            style={{
              background: 'var(--bg-elevated)',
              padding: 16,
              borderRadius: 'var(--radius-md)',
              border: '1px border var(--border)',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              💡 Pro Tip: Quick Start Marketplace
            </div>
            <div style={{ fontSize: 13 }}>
              You can instantly instantiate a fully linked E-Commerce schema with Products, Orders, Customers, Payments, and Reviews in 1 click!
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Step 2: AI Schema Analysis & Business Rules',
      subtitle: 'Automated semantic classification',
      icon: Cpu,
      content: (
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          <p style={{ marginBottom: 14 }}>
            MockForge AI automatically inspects column names, SQL types, and foreign key references to detect semantic meanings (e.g. Indian PAN, GSTIN, Email, Phone, GPS) and infer business rules (e.g. <code style={{ color: 'var(--accent)' }}>Age &gt;= 18</code>, <code style={{ color: 'var(--accent)' }}>OrderDate &lt; DeliveryDate</code>).
          </p>
          <ul style={{ paddingLeft: 20, fontSize: 13, lineHeight: 1.8 }}>
            <li>Confidence scores for semantic fields</li>
            <li>Interactive Accept / Edit / Reject business rule toggles</li>
            <li>Visual ReactFlow relationship graph with zoom/pan</li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Step 3: High-Scale Generation & Data Quality',
      subtitle: 'Background jobs & quality metrics',
      icon: CheckCircle2,
      content: (
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          <p style={{ marginBottom: 14 }}>
            Generate up to 1,000,000+ relational records with zero block on the browser UI using Python worker background streams.
          </p>
          <p style={{ marginBottom: 14 }}>
            Verify completeness, uniqueness, referential integrity, and business rule compliance in the standalone <strong>Data Quality Center</strong>.
          </p>
        </div>
      ),
    },
  ];

  const current = steps[currentStep - 1];

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="modal"
          style={{ maxWidth: 640, position: 'relative' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <current.icon size={22} color="#fff" />
              </div>
              <div>
                <h3 style={{ fontSize: 18, color: 'var(--text-primary)' }}>{current.title}</h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{current.subtitle}</div>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 6,
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div style={{ minHeight: 200, marginBottom: 24 }}>{current.content}</div>

          {/* Stepper Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 18,
              borderTop: '1px solid var(--border)',
            }}
          >
            {/* Step Indicators */}
            <div style={{ display: 'flex', gap: 6 }}>
              {steps.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i + 1 === currentStep ? 24 : 8,
                    height: 8,
                    borderRadius: 4,
                    background: i + 1 === currentStep ? 'var(--primary)' : 'var(--bg-elevated)',
                    transition: 'all var(--transition-fast)',
                  }}
                />
              ))}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 10 }}>
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                  }}
                >
                  <ArrowLeft size={16} /> Back
                </button>
              )}

              {currentStep < steps.length ? (
                <button
                  onClick={() => setCurrentStep((prev) => prev + 1)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    boxShadow: '0 0 15px var(--primary-glow)',
                  }}
                >
                  Next <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    navigate('/projects');
                  }}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, var(--accent), var(--success))',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    boxShadow: '0 0 15px var(--accent-glow)',
                  }}
                >
                  <Play size={16} /> Launch Workspace
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
