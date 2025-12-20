import * as THREE from "three";

/**
 * Simple A* pathfinding algorithm for grid-based navigation
 * @param {number} startIdx - Starting grid index
 * @param {number} goalIdx - Goal grid index
 * @param {number} gridW - Grid width
 * @param {number} gridH - Grid height
 * @param {Set} walkable - Set of walkable grid indices
 * @param {Function} neighborsFn - Function to get neighbors of a grid cell
 * @returns {Array|null} - Array of Vector3 positions or null if no path found
 */
export function astar(startIdx, goalIdx, gridW, gridH, walkable, neighborsFn) {
  const idxToXY = (i) => [i % gridW, Math.floor(i / gridW)];
  const heuristic = (a, b) => {
    const [ax, az] = idxToXY(a);
    const [bx, bz] = idxToXY(b);
    return Math.abs(ax - bx) + Math.abs(az - bz);
  };
  const open = new Set([startIdx]);
  const cameFrom = new Map();
  const gScore = new Map([[startIdx, 0]]);
  const fScore = new Map([[startIdx, heuristic(startIdx, goalIdx)]]);

  while (open.size > 0) {
    let current = null;
    let bestF = Infinity;
    for (const n of open) {
      const f = fScore.get(n) ?? Infinity;
      if (f < bestF) {
        bestF = f;
        current = n;
      }
    }
    if (current === goalIdx) {
      const path = [];
      let c = current;
      while (c !== undefined) {
        const [x, z] = [c % gridW, Math.floor(c / gridW)];
        path.unshift(new THREE.Vector3(x, 0, z));
        c = cameFrom.get(c);
      }
      return path;
    }

    open.delete(current);
    const gcur = gScore.get(current) ?? Infinity;
    const neighbors = neighborsFn(current, gridW, gridH);
    for (const nb of neighbors) {
      if (!walkable.has(nb)) continue;
      const tentativeG = gcur + 1;
      if (tentativeG < (gScore.get(nb) ?? Infinity)) {
        cameFrom.set(nb, current);
        gScore.set(nb, tentativeG);
        fScore.set(nb, tentativeG + heuristic(nb, goalIdx));
        open.add(nb);
      }
    }
  }

  return null;
}

/**
 * Get 4-way neighbors for a grid cell
 * @param {number} idx - Grid index
 * @param {number} gridW - Grid width
 * @param {number} gridH - Grid height
 * @returns {Array} - Array of neighbor indices
 */
export function getNeighbors4Way(idx, gridW, gridH) {
  const x = idx % gridW;
  const z = Math.floor(idx / gridW);
  const out = [];
  if (x > 0) out.push(idx - 1);
  if (x < gridW - 1) out.push(idx + 1);
  if (z > 0) out.push(idx - gridW);
  if (z < gridH - 1) out.push(idx + gridW);
  return out;
}
