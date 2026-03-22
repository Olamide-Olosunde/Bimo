

// const BotThinking = () => {
//   return (
//     <p>Thinking...</p>
//   )
// }

// export default BotThinking


// vibe coded...
import React from 'react';


type ThinkingVariant = 'pulse' | 'morph' | 'wave' | 'orbit';

interface ThinkingIndicatorProps {
  variant?: ThinkingVariant;
  size?: number;
  color?: string;
  className?: string;
}

export const BotThinking: React.FC<ThinkingIndicatorProps> = ({
  variant = 'morph',
  size = 40,
  color = '#6366f1',
  className = '',
}) => {
  const renderAnimation = () => {
    switch (variant) {
      case 'pulse':
        return <PulseAnimation size={size} color={color} />;
      case 'morph':
        return <MorphAnimation size={size} color={color} />;
      case 'wave':
        return <WaveAnimation size={size} color={color} />;
      case 'orbit':
        return <OrbitAnimation size={size} color={color} />;
      default:
        return <MorphAnimation size={size} color={color} />;
    }
  };

  return (
    <div className={`thinking-indicator ${className}`} style={{ width: size, height: size }}>
      {renderAnimation()}
      <style>{styles}</style>
    </div>
  );
};

export default BotThinking;

// Pulsing concentric circles with glow effect
const PulseAnimation: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle className="pulse-ring pulse-ring-1" cx="50" cy="50" r="20" fill="none" stroke={color} strokeWidth="2" />
    <circle className="pulse-ring pulse-ring-2" cx="50" cy="50" r="20" fill="none" stroke={color} strokeWidth="2" />
    <circle className="pulse-ring pulse-ring-3" cx="50" cy="50" r="20" fill="none" stroke={color} strokeWidth="2" />
    <circle className="pulse-core" cx="50" cy="50" r="8" fill={color} />
  </svg>
);

// Morphing blob with organic movement
const MorphAnimation: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <defs>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <path
      className="morph-blob"
      fill={color}
      filter="url(#glow)"
      d="M50,30 Q70,40 70,50 Q70,60 50,70 Q30,60 30,50 Q30,40 50,30 Z"
    />
  </svg>
);

// Flowing wave particles
const WaveAnimation: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle className="wave-dot wave-dot-1" cx="20" cy="50" r="6" fill={color} />
    <circle className="wave-dot wave-dot-2" cx="35" cy="50" r="6" fill={color} />
    <circle className="wave-dot wave-dot-3" cx="50" cy="50" r="6" fill={color} />
    <circle className="wave-dot wave-dot-4" cx="65" cy="50" r="6" fill={color} />
    <circle className="wave-dot wave-dot-5" cx="80" cy="50" r="6" fill={color} />
  </svg>
);

// Orbiting particles around center
const OrbitAnimation: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle className="orbit-particle orbit-particle-1" cx="50" cy="20" r="4" fill={color} />
    <circle className="orbit-particle orbit-particle-2" cx="50" cy="20" r="4" fill={color} />
    <circle className="orbit-particle orbit-particle-3" cx="50" cy="20" r="4" fill={color} />
    <circle className="orbit-center" cx="50" cy="50" r="6" fill={color} opacity="0.5" />
  </svg>
);

const styles = `
  .thinking-indicator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  /* Pulse Animation */
  @keyframes pulse-expand {
    0% {
      r: 20;
      opacity: 1;
    }
    100% {
      r: 40;
      opacity: 0;
    }
  }

  @keyframes pulse-glow {
    0%, 100% {
      opacity: 0.8;
      r: 8;
    }
    50% {
      opacity: 1;
      r: 10;
    }
  }

  .pulse-ring {
    animation: pulse-expand 2s ease-out infinite;
  }

  .pulse-ring-1 {
    animation-delay: 0s;
  }

  .pulse-ring-2 {
    animation-delay: 0.6s;
  }

  .pulse-ring-3 {
    animation-delay: 1.2s;
  }

  .pulse-core {
    animation: pulse-glow 2s ease-in-out infinite;
  }

  /* Morph Animation */
  @keyframes morph {
    0% {
      d: path("M50,30 Q70,40 70,50 Q70,60 50,70 Q30,60 30,50 Q30,40 50,30 Z");
    }
    25% {
      d: path("M50,25 Q75,35 75,50 Q75,65 50,75 Q25,65 25,50 Q25,35 50,25 Z");
    }
    50% {
      d: path("M50,20 Q80,30 80,50 Q80,70 50,80 Q20,70 20,50 Q20,30 50,20 Z");
    }
    75% {
      d: path("M50,25 Q75,35 75,50 Q75,65 50,75 Q25,65 25,50 Q25,35 50,25 Z");
    }
    100% {
      d: path("M50,30 Q70,40 70,50 Q70,60 50,70 Q30,60 30,50 Q30,40 50,30 Z");
    }
  }

  .morph-blob {
    animation: morph 3s ease-in-out infinite;
    transform-origin: center;
  }

  /* Wave Animation */
  @keyframes wave-float {
    0%, 100% {
      transform: translateY(0);
      opacity: 0.5;
    }
    50% {
      transform: translateY(-15px);
      opacity: 1;
    }
  }

  .wave-dot {
    animation: wave-float 1.5s ease-in-out infinite;
  }

  .wave-dot-1 { animation-delay: 0s; }
  .wave-dot-2 { animation-delay: 0.15s; }
  .wave-dot-3 { animation-delay: 0.3s; }
  .wave-dot-4 { animation-delay: 0.45s; }
  .wave-dot-5 { animation-delay: 0.6s; }

  /* Orbit Animation */
  @keyframes orbit {
    from {
      transform: rotate(0deg) translateX(30px) rotate(0deg);
    }
    to {
      transform: rotate(360deg) translateX(30px) rotate(-360deg);
    }
  }

  @keyframes orbit-pulse {
    0%, 100% {
      r: 6;
      opacity: 0.5;
    }
    50% {
      r: 8;
      opacity: 0.8;
    }
  }

  .orbit-particle {
    transform-origin: 50px 50px;
    animation: orbit 2s linear infinite;
  }

  .orbit-particle-1 {
    animation-delay: 0s;
  }

  .orbit-particle-2 {
    animation-delay: 0.66s;
  }

  .orbit-particle-3 {
    animation-delay: 1.33s;
  }

  .orbit-center {
    animation: orbit-pulse 2s ease-in-out infinite;
  }
`;