import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const LINES = ['纯代码', '出片', '5 秒'];

const BG = '#05060b';
const INK = '#eef3fa';
const CYAN = '#4fd8e8';
const WARM = '#f7b267';

export const Vibe: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const t = frame / durationInFrames;

  // whole scene drifts in slightly, like a slow push-in
  const sceneScale = interpolate(frame, [0, durationInFrames], [1.0, 1.035]);

  // background lights wander
  const glowX = interpolate(t, [0, 1], [0.28, 0.62]);
  const glowY = interpolate(t, [0, 1], [0.34, 0.52]);

  const ruleProgress = spring({
    frame: frame - 46,
    fps,
    config: { damping: 200, mass: 0.6 },
  });

  const captionOpacity = interpolate(frame, [92, 112], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <AbsoluteFill
        style={{
          transform: `scale(${sceneScale})`,
          background: `
            radial-gradient(60% 46% at ${glowX * 100}% ${glowY * 100}%, rgba(79,216,232,0.22), transparent 70%),
            radial-gradient(52% 40% at ${(1 - glowX) * 100}% ${(1 - glowY) * 100 + 18}%, rgba(247,178,103,0.14), transparent 72%),
            ${BG}
          `,
        }}
      />

      {/* vignette */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(120% 90% at 50% 45%, transparent 40%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: 'center',
          paddingLeft: 108,
          paddingRight: 108,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {LINES.map((text, i) => {
            const start = 10 + i * 15;
            const s = spring({
              frame: frame - start,
              fps,
              config: { damping: 15, mass: 0.7, stiffness: 110 },
            });
            const y = interpolate(s, [0, 1], [56, 0]);
            const opacity = interpolate(s, [0, 1], [0, 1]);
            const isLast = i === LINES.length - 1;

            return (
              <div
                key={text}
                style={{
                  transform: `translateY(${y}px)`,
                  opacity,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 24,
                }}
              >
                <span
                  style={{
                    fontFamily:
                      '"PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Noto Sans SC", "Helvetica Neue", sans-serif',
                    fontSize: 148,
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    lineHeight: 1.06,
                    color: isLast ? CYAN : INK,
                    textShadow: isLast
                      ? '0 0 46px rgba(79,216,232,0.45)'
                      : '0 0 30px rgba(238,243,250,0.10)',
                  }}
                >
                  {text}
                </span>
                {i === 1 && (
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 999,
                      backgroundColor: WARM,
                      boxShadow: '0 0 26px rgba(247,178,103,0.85)',
                      transform: 'translateY(-78px)',
                      opacity: s,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 44,
            height: 2,
            width: 520 * ruleProgress,
            background: `linear-gradient(90deg, ${CYAN}, rgba(79,216,232,0))`,
            opacity: 0.9,
          }}
        />
      </AbsoluteFill>

      <div
        style={{
          position: 'absolute',
          left: 108,
          bottom: 96,
          fontFamily: '"SF Mono", ui-monospace, Menlo, monospace',
          fontSize: 26,
          letterSpacing: '0.18em',
          color: 'rgba(238,243,250,0.55)',
          opacity: captionOpacity,
          textTransform: 'uppercase',
        }}
      >
        route b · remotion · 5s
      </div>
    </AbsoluteFill>
  );
};
