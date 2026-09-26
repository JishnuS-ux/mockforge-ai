interface LogoProps {
  size?: number;
  showText?: boolean;
}

export default function Logo({ size = 36, showText = false }: LogoProps) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: 'drop-shadow(0 0 14px rgba(122, 92, 255, 0.55))',
          flexShrink: 0,
        }}
      >
        <defs>
          <linearGradient id="df-grad-top" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7A5CFF" />
            <stop offset="100%" stopColor="#00F0FF" />
          </linearGradient>
          <linearGradient id="df-grad-left" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9E7AFF" />
            <stop offset="100%" stopColor="#5E35FF" />
          </linearGradient>
          <linearGradient id="df-grad-right" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="100%" stopColor="#7A5CFF" />
          </linearGradient>
        </defs>

        {/* 3D Isometric Data Forge Cube */}
        <path d="M24 5L41 14.5L24 24L7 14.5L24 5Z" fill="url(#df-grad-top)" />
        <path d="M7 14.5L24 24V43L7 33.5V14.5Z" fill="url(#df-grad-left)" opacity="0.85" />
        <path d="M24 24L41 14.5V33.5L24 43V24Z" fill="url(#df-grad-right)" opacity="0.95" />

        {/* Inner AI Circuit Node */}
        <circle cx="24" cy="24" r="3.5" fill="#FFFFFF" />
        <path d="M24 16V32M16 24H32" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
      </svg>

      {showText && (
        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 17,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
            className="gradient-text"
          >
            DataForge AI
          </div>
          <div
            style={{
              fontSize: 10,
              color: 'var(--accent)',
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
            }}
          >
            Synthetic Data Platform
          </div>
        </div>
      )}
    </div>
  );
}
