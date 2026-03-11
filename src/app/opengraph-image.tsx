import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Konstbyte — Marknadsplats för konst';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 60%, #7c2d12 100%)',
          fontFamily: 'Georgia, serif',
        }}
      >
        {/* Decorative top border */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #f59e0b, #d97706, #f59e0b)',
          }}
        />

        {/* Palette icon */}
        <div style={{ fontSize: 80, marginBottom: 24 }}>🎨</div>

        {/* Brand name */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: '#f8fafc',
            letterSpacing: '-2px',
            lineHeight: 1,
            marginBottom: 20,
          }}
        >
          Konstbyte
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: '#fbbf24',
            fontWeight: 400,
            letterSpacing: '0.05em',
            marginBottom: 40,
          }}
        >
          Marknadsplats för konst
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 22,
            color: '#94a3b8',
            maxWidth: 700,
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          Köp och sälj original konst direkt från svenska konstnärer
        </div>

        {/* Domain */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 20,
            color: '#475569',
            letterSpacing: '0.1em',
          }}
        >
          konstbyte.se
        </div>
      </div>
    ),
    { ...size }
  );
}
