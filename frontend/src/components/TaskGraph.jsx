import React, { useRef, useEffect, useState } from 'react';

const TaskGraph = ({ tasks, criticalIds }) => {
  const activeTasks = tasks.filter(t => t.status !== "Done");
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 350 });

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth - 40,
        height: 350
      });
    }
  }, [activeTasks.length]);

  const cols = dimensions.width > 450 ? 3 : 2;

  const nodes = activeTasks.map((task, index) => ({
    ...task,
    x: 30 + (index % cols) * (dimensions.width / cols),
    y: 30 + Math.floor(index / cols) * 80
  }));

  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
  const nodeW = 100;
  const nodeH = 40;

  const maxRow = activeTasks.length > 0 ? Math.floor((activeTasks.length - 1) / cols) : 0;
  const graphH = Math.max(100, 30 + maxRow * 80 + nodeH + 30);

  return (
    <div className="card p-5" ref={containerRef}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-300">Dependency Graph</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-600"></span>
            <span className="text-[11px] text-slate-500">Standard</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-[11px] text-slate-500">Critical</span>
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-auto" style={{ height: graphH }}>
        <svg className="absolute inset-0 w-full pointer-events-none" style={{ height: graphH }}>
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#475569" />
            </marker>
            <marker id="arrow-crit" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#f59e0b" />
            </marker>
          </defs>

          {nodes.map(node =>
            (node.dependencies || []).map(dep => {
              const target = nodeMap[dep.id];
              if (!target) return null;
              const isCritEdge = criticalIds.includes(node.id) && criticalIds.includes(target.id);

              const tCX = target.x + nodeW / 2;
              const tCY = target.y + nodeH / 2;
              const nCX = node.x + nodeW / 2;
              const nCY = node.y + nodeH / 2;

              let sx = tCX, sy = tCY, ex = nCX, ey = nCY;

              if (Math.abs(nCX - tCX) > Math.abs(nCY - tCY)) {
                if (nCX > tCX) { sx = target.x + nodeW; sy = target.y + nodeH / 2; ex = node.x; ey = node.y + nodeH / 2; }
                else { sx = target.x; sy = target.y + nodeH / 2; ex = node.x + nodeW; ey = node.y + nodeH / 2; }
              } else {
                if (nCY > tCY) { sx = target.x + nodeW / 2; sy = target.y + nodeH; ex = node.x + nodeW / 2; ey = node.y; }
                else { sx = target.x + nodeW / 2; sy = target.y; ex = node.x + nodeW / 2; ey = node.y + nodeH; }
              }

              const dx = ex - sx, dy = ey - sy;
              const mx = sx + dx / 2 + (dy !== 0 ? 10 : 0);
              const my = sy + dy / 2 - (dx !== 0 ? 10 : 0);

              return (
                <path
                  key={`${node.id}-${dep.id}`}
                  d={`M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`}
                  fill="none"
                  stroke={isCritEdge ? "#f59e0b" : "#334155"}
                  strokeWidth={isCritEdge ? "1.5" : "1"}
                  strokeDasharray={isCritEdge ? "none" : "4,3"}
                  markerEnd={`url(#${isCritEdge ? 'arrow-crit' : 'arrow'})`}
                />
              );
            })
          )}
        </svg>

        {nodes.map(node => {
          const isCritical = criticalIds.includes(node.id);
          return (
            <div
              key={node.id}
              className={`absolute w-[100px] px-2 py-2 rounded-lg border text-center transition-colors ${
                isCritical
                  ? 'border-amber-500/40 bg-amber-500/5 text-amber-400'
                  : 'border-slate-700 bg-slate-800/80 text-slate-400'
              }`}
              style={{ left: node.x, top: node.y }}
            >
              <div className="text-[11px] font-medium truncate">{node.title}</div>
              {isCritical && (
                <div className="text-[9px] text-amber-500 mt-0.5">critical</div>
              )}
            </div>
          );
        })}

        {activeTasks.length === 0 && (
          <div className="flex items-center justify-center h-full text-slate-600">
            <p className="text-xs">No active tasks to visualize.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskGraph;
