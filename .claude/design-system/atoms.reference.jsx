const { useState } = React;

// ============ Shared atoms ============

window.VzLogo = function VzLogo({ size = 24, dark = false }) {
  return (
    <span style={{
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      letterSpacing: '-0.02em',
      fontSize: size,
      color: dark ? '#FAF8F6' : '#1A1A1A',
      userSelect: 'none',
    }}>
      Vizly<span style={{ color: dark ? '#C8F169' : '#8AB83D' }}>.</span>
    </span>
  );
};

window.VzBtn = function VzBtn({ children, variant = 'primary', size = 'md', onClick, style }) {
  const base = {
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    transition: 'all 150ms ease',
    whiteSpace: 'nowrap',
  };
  const sizes = {
    sm: { padding: '8px 14px', fontSize: 13 },
    md: { padding: '11px 18px', fontSize: 14 },
    lg: { padding: '14px 22px', fontSize: 15 },
  };
  const variants = {
    primary: { background: '#1A1A1A', color: '#fff', boxShadow: size === 'lg' ? '3px 3px 0 #C8F169' : '2px 2px 0 #C8F169' },
    secondary: { background: '#fff', color: '#1A1A1A', border: '1.5px solid #1A1A1A' },
    ghost: { background: 'transparent', color: '#6B6560', fontWeight: 500 },
  };
  return (
    <button
      onClick={onClick}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      onMouseEnter={e => {
        if (variant === 'primary') {
          e.currentTarget.style.transform = 'translate(1px,1px)';
          e.currentTarget.style.boxShadow = size === 'lg' ? '2px 2px 0 #C8F169' : '1px 1px 0 #C8F169';
        } else if (variant === 'secondary') {
          e.currentTarget.style.background = '#FAF8F6';
        } else if (variant === 'ghost') {
          e.currentTarget.style.color = '#1A1A1A';
        }
      }}
      onMouseLeave={e => {
        if (variant === 'primary') {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = size === 'lg' ? '3px 3px 0 #C8F169' : '2px 2px 0 #C8F169';
        } else if (variant === 'secondary') {
          e.currentTarget.style.background = '#fff';
        } else if (variant === 'ghost') {
          e.currentTarget.style.color = '#6B6560';
        }
      }}
    >{children}</button>
  );
};

window.VzHighlight = function VzHighlight({ children }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', whiteSpace: 'nowrap' }}>
      <span style={{
        position: 'absolute', inset: '-2px -6px',
        background: '#C8F169', borderRadius: 3,
        transform: 'rotate(-1.5deg)', zIndex: 0,
      }} />
      <span style={{ position: 'relative', zIndex: 1, padding: '0 4px' }}>{children}</span>
    </span>
  );
};

window.VzBadge = function VzBadge({ variant = 'online', children }) {
  const variants = {
    online: { bg: '#E8F5E9', fg: '#1B5E20' },
    draft: { bg: '#FAF8F6', fg: '#6B6560', border: '1px solid #EDE6DE' },
    popular: { bg: '#1A1A1A', fg: '#C8F169' },
    pro: { bg: '#C8F169', fg: '#1A1A1A' },
  };
  const v = variants[variant];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: v.bg, color: v.fg, border: v.border || 'none',
      borderRadius: 9999, padding: '4px 10px',
      fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em',
      textTransform: 'uppercase', fontFamily: 'var(--font-display)',
    }}>{children}</span>
  );
};

window.VzAvatar = function VzAvatar({ initials, size = 40 }) {
  return (
    <div style={{
      width: size, height: size,
      background: '#C8F169', borderRadius: size >= 48 ? 10 : 8,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontWeight: 800,
      fontSize: size * 0.32, color: '#1A1A1A',
      flexShrink: 0,
    }}>{initials}</div>
  );
};
