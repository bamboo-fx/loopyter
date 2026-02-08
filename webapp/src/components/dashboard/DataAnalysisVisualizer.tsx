import { useState, useEffect, useRef, useCallback } from 'react';

interface DataAnalysisVisualizerProps {
  isVisible: boolean;
  analysisData?: {
    columnsCount: number;
    rowsCount: number;
  };
}

interface NeuralNode {
  id: string;
  x: number;
  y: number;
  layer: number;
  isActive: boolean;
  pulseIntensity: number;
}

interface Connection {
  id: string;
  fromNode: string;
  toNode: string;
  isActive: boolean;
  pulseProgress: number;
}

interface DataParticle {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  opacity: number;
}

interface InsightNotification {
  id: number;
  message: string;
  opacity: number;
  createdAt: number;
}

const INSIGHT_MESSAGES = [
  'Pattern detected in column data',
  'Strong correlation found',
  'Outlier cluster identified',
  'Trend analysis complete',
  'Distribution anomaly detected',
  'Feature importance calculated',
  'Seasonality pattern found',
  'Data relationship mapped',
  'Statistical significance confirmed',
  'Cluster boundary identified',
];

const DataAnalysisVisualizer = ({ isVisible, analysisData }: DataAnalysisVisualizerProps) => {
  const [nodes, setNodes] = useState<NeuralNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [particles, setParticles] = useState<DataParticle[]>([]);
  const [insights, setInsights] = useState<InsightNotification[]>([]);
  const [stats, setStats] = useState({
    patternsFound: 0,
    correlations: 0,
    featuresAnalyzed: 0,
    progress: 0,
  });
  const [floatingPoints, setFloatingPoints] = useState<{ id: number; x: number; y: number; size: number; delay: number }[]>([]);

  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const insightCountRef = useRef<number>(0);

  const totalFeatures = analysisData?.columnsCount || 12;
  const ANIMATION_DURATION = 8000;

  // Neural network configuration
  const LAYERS = [4, 6, 8, 6, 4]; // nodes per layer
  const LAYER_SPACING = 120;
  const NODE_SPACING = 50;

  // Initialize neural network
  const initializeNetwork = useCallback(() => {
    const newNodes: NeuralNode[] = [];
    const newConnections: Connection[] = [];
    const centerY = 200;

    LAYERS.forEach((nodeCount, layerIndex) => {
      const layerX = 80 + layerIndex * LAYER_SPACING;
      const startY = centerY - ((nodeCount - 1) * NODE_SPACING) / 2;

      for (let i = 0; i < nodeCount; i++) {
        const nodeId = `${layerIndex}-${i}`;
        newNodes.push({
          id: nodeId,
          x: layerX,
          y: startY + i * NODE_SPACING,
          layer: layerIndex,
          isActive: false,
          pulseIntensity: 0,
        });

        // Create connections to next layer
        if (layerIndex < LAYERS.length - 1) {
          const nextLayerNodeCount = LAYERS[layerIndex + 1];
          for (let j = 0; j < nextLayerNodeCount; j++) {
            // Only connect to nearby nodes (not all, to reduce visual clutter)
            if (Math.abs(i - j * (nodeCount / nextLayerNodeCount)) < 2) {
              newConnections.push({
                id: `${nodeId}-to-${layerIndex + 1}-${j}`,
                fromNode: nodeId,
                toNode: `${layerIndex + 1}-${j}`,
                isActive: false,
                pulseProgress: 0,
              });
            }
          }
        }
      }
    });

    setNodes(newNodes);
    setConnections(newConnections);
  }, []);

  // Initialize floating background points
  useEffect(() => {
    if (!isVisible) return;

    const points = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 5,
    }));
    setFloatingPoints(points);
  }, [isVisible]);

  // Initialize on visibility change
  useEffect(() => {
    if (!isVisible) {
      return;
    }

    initializeNetwork();
    setStats({ patternsFound: 0, correlations: 0, featuresAnalyzed: 0, progress: 0 });
    setInsights([]);
    setParticles([]);
    insightCountRef.current = 0;
    startTimeRef.current = Date.now();
  }, [isVisible, initializeNetwork]);

  // Main animation loop
  useEffect(() => {
    if (!isVisible || nodes.length === 0) return;

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

      // Update stats with easing
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setStats({
        patternsFound: Math.floor(easedProgress * 24),
        correlations: Math.floor(easedProgress * 16),
        featuresAnalyzed: Math.floor(easedProgress * totalFeatures),
        progress: Math.floor(easedProgress * 100),
      });

      // Activate nodes in waves
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          const layerProgress = progress * (LAYERS.length + 1);
          const shouldActivate = node.layer < layerProgress;
          const pulsePhase = (elapsed / 1000 + node.layer * 0.3 + parseInt(node.id.split('-')[1]) * 0.1) % 2;
          const pulseIntensity = shouldActivate ? Math.sin(pulsePhase * Math.PI) * 0.5 + 0.5 : 0;

          return {
            ...node,
            isActive: shouldActivate,
            pulseIntensity,
          };
        })
      );

      // Activate connections with pulse effect
      setConnections((prevConnections) =>
        prevConnections.map((conn) => {
          const [fromLayer] = conn.fromNode.split('-').map(Number);
          const connectionProgress = progress * (LAYERS.length + 1) - fromLayer;
          const isActive = connectionProgress > 0 && connectionProgress < 2;
          const pulseProgress = Math.max(0, Math.min(1, connectionProgress));

          return {
            ...conn,
            isActive,
            pulseProgress,
          };
        })
      );

      // Generate data particles
      if (Math.random() > 0.6 && progress < 0.95) {
        setParticles((prev) => {
          const startY = 50 + Math.random() * 300;
          const newParticle: DataParticle = {
            id: Date.now() + Math.random(),
            x: 0,
            y: startY,
            targetX: 600,
            targetY: startY + (Math.random() - 0.5) * 100,
            speed: 3 + Math.random() * 4,
            opacity: 0.8,
          };
          return [...prev.slice(-15), newParticle];
        });
      }

      // Update particle positions
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.speed,
            y: p.y + (p.targetY - p.y) * 0.02,
            opacity: p.x > 500 ? p.opacity - 0.05 : p.opacity,
          }))
          .filter((p) => p.opacity > 0 && p.x < 650)
      );

      // Generate insight notifications
      const insightThreshold = Math.floor(progress * 6);
      if (insightCountRef.current < insightThreshold && progress < 0.95) {
        const newInsight: InsightNotification = {
          id: Date.now(),
          message: INSIGHT_MESSAGES[insightCountRef.current % INSIGHT_MESSAGES.length],
          opacity: 1,
          createdAt: Date.now(),
        };
        setInsights((prev) => [...prev.slice(-3), newInsight]);
        insightCountRef.current++;
      }

      // Fade out old insights
      setInsights((prev) =>
        prev
          .map((insight) => ({
            ...insight,
            opacity: Date.now() - insight.createdAt > 2000 ? insight.opacity - 0.05 : insight.opacity,
          }))
          .filter((insight) => insight.opacity > 0)
      );

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, nodes.length, totalFeatures]);

  // Get node by ID helper
  const getNodeById = (id: string): NeuralNode | undefined => {
    return nodes.find((n) => n.id === id);
  };

  // Circular progress component
  const CircularProgress = ({ value, size = 80 }: { value: number; size?: number }) => {
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-zinc-800"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#purpleGradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
              transition: 'stroke-dashoffset 0.5s ease-out',
            }}
          />
          <defs>
            <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-violet-400 font-mono">{value}%</span>
        </div>
      </div>
    );
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95 backdrop-blur-md animate-in fade-in duration-300">
      {/* Grid background pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Floating data points background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingPoints.map((point) => (
          <div
            key={point.id}
            className="absolute rounded-full bg-violet-500/30"
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              width: point.size,
              height: point.size,
              animation: `float ${3 + point.delay}s ease-in-out infinite`,
              animationDelay: `${point.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Ambient glow */}
      <div
        className="absolute top-1/2 left-1/3 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Main content container */}
      <div className="relative flex flex-col lg:flex-row gap-6 p-6 max-w-6xl w-full mx-4 animate-in zoom-in-95 duration-400">
        {/* Neural Network Section */}
        <div className="flex-1">
          <div className="mb-4 animate-in slide-in-from-bottom duration-300">
            <h2 className="text-xl font-bold text-violet-400 flex items-center gap-2 font-mono">
              <span className="inline-block w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
              AI DATA ANALYSIS
            </h2>
            <p className="text-zinc-500 text-sm font-mono mt-1">
              Discovering patterns and insights...
            </p>
          </div>

          {/* Neural Network Visualization */}
          <div className="relative bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 overflow-hidden">
            <svg width="100%" height="400" viewBox="0 0 600 400" className="w-full">
              {/* Connection lines */}
              {connections.map((conn) => {
                const fromNode = getNodeById(conn.fromNode);
                const toNode = getNodeById(conn.toNode);
                if (!fromNode || !toNode) return null;

                return (
                  <g key={conn.id}>
                    {/* Base line */}
                    <line
                      x1={fromNode.x}
                      y1={fromNode.y}
                      x2={toNode.x}
                      y2={toNode.y}
                      stroke="rgba(139, 92, 246, 0.15)"
                      strokeWidth="1"
                    />
                    {/* Animated pulse line */}
                    {conn.isActive && (
                      <line
                        x1={fromNode.x}
                        y1={fromNode.y}
                        x2={fromNode.x + (toNode.x - fromNode.x) * conn.pulseProgress}
                        y2={fromNode.y + (toNode.y - fromNode.y) * conn.pulseProgress}
                        stroke="url(#connectionGradient)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        style={{
                          filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.6))',
                        }}
                      />
                    )}
                  </g>
                );
              })}

              {/* Data particles */}
              {particles.map((particle) => (
                <circle
                  key={particle.id}
                  cx={particle.x}
                  cy={particle.y}
                  r="3"
                  fill="#a855f7"
                  opacity={particle.opacity}
                  style={{
                    filter: 'drop-shadow(0 0 6px rgba(168, 85, 247, 0.8))',
                  }}
                />
              ))}

              {/* Neural nodes */}
              {nodes.map((node) => (
                <g key={node.id}>
                  {/* Outer glow */}
                  {node.isActive && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={14 + node.pulseIntensity * 6}
                      fill="none"
                      stroke="rgba(139, 92, 246, 0.3)"
                      strokeWidth="2"
                      opacity={node.pulseIntensity}
                    />
                  )}
                  {/* Main node */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="10"
                    fill={node.isActive ? `rgba(139, 92, 246, ${0.3 + node.pulseIntensity * 0.7})` : 'rgba(63, 63, 70, 0.5)'}
                    stroke={node.isActive ? '#8b5cf6' : '#3f3f46'}
                    strokeWidth="2"
                    style={{
                      filter: node.isActive ? `drop-shadow(0 0 ${8 + node.pulseIntensity * 8}px rgba(139, 92, 246, ${0.4 + node.pulseIntensity * 0.4}))` : 'none',
                      transition: 'all 0.3s ease-out',
                    }}
                  />
                  {/* Inner bright core */}
                  {node.isActive && node.pulseIntensity > 0.7 && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="4"
                      fill="#c4b5fd"
                      opacity={node.pulseIntensity}
                    />
                  )}
                </g>
              ))}

              {/* Gradient definitions */}
              <defs>
                <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="50%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>

            {/* Layer labels */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-around px-8">
              {['Input', 'Hidden 1', 'Hidden 2', 'Hidden 3', 'Output'].map((label, i) => (
                <span
                  key={label}
                  className="text-xs font-mono text-zinc-600"
                  style={{ opacity: stats.progress > i * 20 ? 1 : 0.3 }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 flex items-center gap-2 animate-in fade-in duration-500 delay-300">
            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 transition-all duration-300 ease-out"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
            <span className="text-xs font-mono text-zinc-500">{stats.progress}%</span>
          </div>
        </div>

        {/* Stats and Insights Panel */}
        <div className="w-full lg:w-72 space-y-4 animate-in slide-in-from-right duration-400 delay-200">
          {/* Metrics Panel */}
          <div className="bg-zinc-900/70 rounded-lg border border-zinc-800 p-4">
            <h3 className="text-sm font-mono text-zinc-400 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
              LIVE METRICS
            </h3>

            {/* Progress Ring */}
            <div className="flex justify-center mb-4">
              <CircularProgress value={stats.progress} />
            </div>
            <p className="text-center text-xs font-mono text-zinc-500 mb-6">Analysis Progress</p>

            {/* Stats */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-zinc-500">Patterns Found</span>
                <span className="text-sm font-mono text-violet-400 tabular-nums">{stats.patternsFound}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-zinc-500">Correlations</span>
                <span className="text-sm font-mono text-purple-400 tabular-nums">{stats.correlations}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-zinc-500">Features Analyzed</span>
                <span className="text-sm font-mono text-fuchsia-400 tabular-nums">
                  {stats.featuresAnalyzed} / {totalFeatures}
                </span>
              </div>
            </div>
          </div>

          {/* Discovery Notifications */}
          <div className="bg-zinc-900/70 rounded-lg border border-zinc-800 p-4">
            <h3 className="text-sm font-mono text-zinc-400 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
              DISCOVERIES
            </h3>

            <div className="space-y-2 min-h-[120px]">
              {insights.length === 0 ? (
                <p className="text-xs font-mono text-zinc-600 italic">Scanning for patterns...</p>
              ) : (
                insights.map((insight) => (
                  <div
                    key={insight.id}
                    className="flex items-start gap-2 p-2 bg-violet-500/10 border border-violet-500/20 rounded text-xs font-mono text-violet-300 animate-in slide-in-from-bottom-2 duration-300"
                    style={{ opacity: insight.opacity }}
                  >
                    <span className="text-violet-400 mt-0.5">+</span>
                    <span>{insight.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Analysis Stage */}
          <div className="bg-zinc-900/70 rounded-lg border border-zinc-800 p-4">
            <h3 className="text-sm font-mono text-zinc-400 mb-3">ANALYSIS STAGE</h3>
            <div className="space-y-2">
              {[
                { name: 'Feature extraction', threshold: 10 },
                { name: 'Pattern recognition', threshold: 30 },
                { name: 'Correlation mapping', threshold: 50 },
                { name: 'Insight generation', threshold: 70 },
                { name: 'Report compilation', threshold: 90 },
              ].map((stage, i) => (
                <div key={stage.name} className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full transition-all duration-500 ${
                      stats.progress >= stage.threshold
                        ? 'bg-violet-400'
                        : stats.progress >= stage.threshold - 10
                        ? 'bg-violet-400/50 animate-pulse'
                        : 'bg-zinc-700'
                    }`}
                    style={{
                      boxShadow: stats.progress >= stage.threshold ? '0 0 8px rgba(139, 92, 246, 0.5)' : 'none',
                    }}
                  />
                  <span
                    className={`text-xs font-mono transition-colors duration-300 ${
                      stats.progress >= stage.threshold ? 'text-violet-400' : 'text-zinc-600'
                    }`}
                  >
                    {stage.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scan line effect */}
      <div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent pointer-events-none"
        style={{
          animation: 'scanline 4s linear infinite',
        }}
      />

      {/* CSS Keyframes */}
      <style>{`
        @keyframes scanline {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.2); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default DataAnalysisVisualizer;
