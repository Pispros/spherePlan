/* ─── EDGE RENDERING ────────────────────────────────────────────────── */
function renderEdge(edge) {
  const svg = $("#connections");
  const hit = document.createElementNS("http://www.w3.org/2000/svg", "path");
  hit.classList.add("connection-hit");
  hit.dataset.from = edge.from;
  hit.dataset.to = edge.to;
  hit.addEventListener("click", (e) => {
    e.stopPropagation();
    selectEdge(edge);
  });
  svg.appendChild(hit);

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.classList.add("connection-path");
  path.dataset.from = edge.from;
  path.dataset.to = edge.to;
  path.dataset.type = edge.type;
  applyEdgeStyle(path, edge.type);
  svg.appendChild(path);

  edge._hit = hit;
  edge._path = path;
}

function applyEdgeStyle(path, type) {
  path.setAttribute("fill", "none");
  path.setAttribute("stroke-linecap", "round");
  path.removeAttribute("stroke-dasharray");
  path.style.filter = "";
  switch (type) {
    case "critical":
      path.setAttribute("stroke", "rgba(255,107,157,0.85)");
      path.setAttribute("stroke-width", "1.4");
      path.style.filter = "drop-shadow(0 0 6px rgba(255,107,157,0.6))";
      break;
    case "dashed":
      path.setAttribute("stroke", "rgba(255,255,255,0.42)");
      path.setAttribute("stroke-width", "1.1");
      path.setAttribute("stroke-dasharray", "5 5");
      break;
    case "optional":
      path.setAttribute("stroke", "rgba(94,234,212,0.55)");
      path.setAttribute("stroke-width", "1.1");
      path.setAttribute("stroke-dasharray", "2 4");
      break;
    default:
      path.setAttribute("stroke", "rgba(255,255,255,0.42)");
      path.setAttribute("stroke-width", "1.1");
  }
}

function nodeAnchor(nodeData) {
  const nodesLayer = $("#nodes");
  const el = nodesLayer.querySelector(`.node[data-id="${nodeData.id}"]`);
  const w = 232;
  const h = el?.offsetHeight || 132;
  return {
    cx: nodeData.x + w / 2,
    cy: nodeData.y + h / 2,
    rx: w / 2,
    ry: h / 2,
  };
}

function edgePoint(box, dx, dy) {
  const { cx, cy, rx, ry } = box;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const tx = rx / Math.abs(dx);
  const ty = ry / Math.abs(dy);
  const t2 = Math.min(tx, ty);
  return { x: cx + dx * t2, y: cy + dy * t2 };
}

function pathFor(fromId, toId) {
  const proj = getCurrentProject();
  if (!proj) return "";
  const a = proj.nodes.find((n) => n.id === fromId);
  const b = proj.nodes.find((n) => n.id === toId);
  if (!a || !b) return "";
  const A = nodeAnchor(a);
  const B = nodeAnchor(b);
  const dx = B.cx - A.cx,
    dy = B.cy - A.cy;
  const p1 = edgePoint(A, dx, dy);
  const p2 = edgePoint(B, -dx, -dy);
  const dist = Math.hypot(dx, dy);
  const handle = Math.min(160, Math.max(40, dist * 0.4));
  const horizontal = Math.abs(dx) > Math.abs(dy);
  let c1x, c1y, c2x, c2y;
  if (horizontal) {
    c1x = p1.x + Math.sign(dx) * handle;
    c1y = p1.y;
    c2x = p2.x - Math.sign(dx) * handle;
    c2y = p2.y;
  } else {
    c1x = p1.x;
    c1y = p1.y + Math.sign(dy) * handle;
    c2x = p2.x;
    c2y = p2.y - Math.sign(dy) * handle;
  }
  return `M ${p1.x} ${p1.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
}

function updateAllPaths() {
  const svg = $("#connections");
  svg.querySelectorAll("path").forEach((p) => {
    if (!p.dataset.from) return;
    p.setAttribute("d", pathFor(p.dataset.from, p.dataset.to));
  });
  if (STATE.selectedEdge) positionEdgePopover(STATE.selectedEdge);
}

/* ─── LINK CREATION ─────────────────────────────────────────────────── */
function handlePos(nodeData, side) {
  const nodesLayer = $("#nodes");
  const el = nodesLayer.querySelector(`.node[data-id="${nodeData.id}"]`);
  const w = 232,
    h = el?.offsetHeight || 132;
  switch (side) {
    case "n":
      return { x: nodeData.x + w / 2, y: nodeData.y };
    case "s":
      return { x: nodeData.x + w / 2, y: nodeData.y + h };
    case "w":
      return { x: nodeData.x, y: nodeData.y + h / 2 };
    case "e":
      return { x: nodeData.x + w, y: nodeData.y + h / 2 };
  }
}

function startLinking(e, fromNode, side) {
  const canvas = $("#canvas");
  const svg = $("#connections");
  e.stopPropagation();
  e.preventDefault();
  const ghostPath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path",
  );
  ghostPath.classList.add("ghost-path");
  svg.appendChild(ghostPath);
  document.body.classList.add("linking-active");
  e.target.classList.add("hot");

  const onMove = (ev) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (ev.clientX - rect.left - STATE.panX) / STATE.scale;
    const my = (ev.clientY - rect.top - STATE.panY) / STATE.scale;
    const start = handlePos(fromNode, side);
    const dx = mx - start.x,
      dy = my - start.y;
    const dist = Math.hypot(dx, dy);
    const handleLen = Math.min(160, Math.max(40, dist * 0.4));
    const horizontal = side === "e" || side === "w";
    let c1x, c1y, c2x, c2y;
    if (horizontal) {
      const sign = side === "e" ? 1 : -1;
      c1x = start.x + sign * handleLen;
      c1y = start.y;
      c2x = mx - sign * Math.min(handleLen, Math.abs(dx) * 0.5);
      c2y = my;
    } else {
      const sign = side === "s" ? 1 : -1;
      c1x = start.x;
      c1y = start.y + sign * handleLen;
      c2x = mx;
      c2y = my - sign * Math.min(handleLen, Math.abs(dy) * 0.5);
    }
    ghostPath.setAttribute(
      "d",
      `M ${start.x} ${start.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${mx} ${my}`,
    );
    $$(".node.drop-target").forEach((n) => n.classList.remove("drop-target"));
    const elUnder = document.elementFromPoint(ev.clientX, ev.clientY);
    const targetEl = elUnder?.closest(".node");
    if (targetEl && targetEl.dataset.id !== fromNode.id)
      targetEl.classList.add("drop-target");
  };

  const onUp = (ev) => {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
    document.body.classList.remove("linking-active");
    e.target.classList.remove("hot");
    ghostPath.remove();
    $$(".node.drop-target").forEach((n) => n.classList.remove("drop-target"));
    const elUnder = document.elementFromPoint(ev.clientX, ev.clientY);
    const targetEl = elUnder?.closest(".node");
    if (targetEl && targetEl.dataset.id !== fromNode.id) {
      const proj = getCurrentProject();
      if (
        !proj.edges.find(
          (e) => e.from === fromNode.id && e.to === targetEl.dataset.id,
        )
      ) {
        const newEdge = {
          from: fromNode.id,
          to: targetEl.dataset.id,
          type: "solid",
        };
        proj.edges.push(newEdge);
        saveProjects();
        renderEdge(newEdge);
        updateAllPaths();
        setTimeout(() => selectEdge(newEdge), 50);
      }
    }
  };
  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
}

/* ─── EDGE SELECTION & POPOVER ──────────────────────────────────────── */
function selectEdge(edge) {
  const edgePopover = $("#edgePopover");
  $$(".connection-path.selected").forEach((p) =>
    p.classList.remove("selected"),
  );
  $$(".node.selected").forEach((n) => n.classList.remove("selected"));
  STATE.selectedEdge = edge;
  STATE.selectedNodeId = null;
  if (edge._path) edge._path.classList.add("selected");
  edgePopover.querySelectorAll(".edge-popover-btn[data-type]").forEach((b) => {
    b.classList.toggle("active", b.dataset.type === edge.type);
  });
  positionEdgePopover(edge);
  edgePopover.classList.add("open");
}

function positionEdgePopover(edge) {
  const edgePopover = $("#edgePopover");
  const canvas = $("#canvas");
  if (!edge._path) return;
  try {
    const len = edge._path.getTotalLength();
    if (len === 0) return;
    const mid = edge._path.getPointAtLength(len / 2);
    const rect = canvas.getBoundingClientRect();
    const sx = mid.x * STATE.scale + STATE.panX + rect.left;
    const sy = mid.y * STATE.scale + STATE.panY + rect.top;
    edgePopover.style.left = sx + "px";
    edgePopover.style.top = sy + "px";
  } catch {}
}

function closeEdgePopover() {
  const edgePopover = $("#edgePopover");
  edgePopover.classList.remove("open");
  $$(".connection-path.selected").forEach((p) =>
    p.classList.remove("selected"),
  );
  STATE.selectedEdge = null;
}

function deleteEdge(edge) {
  const proj = getCurrentProject();
  if (!proj) return;
  if (edge._path) edge._path.remove();
  if (edge._hit) edge._hit.remove();
  proj.edges = proj.edges.filter((e) => e !== edge);
  saveProjects();
  closeEdgePopover();
}

function initEdgePopover() {
  const edgePopover = $("#edgePopover");
  edgePopover
    .querySelectorAll(".edge-popover-btn[data-type]")
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!STATE.selectedEdge) return;

        // Check if this is a home edge (between projects) or a task edge
        const isHomeEdge = STATE.selectedEdge._path?.dataset.homeEdge === "1";

        if (isHomeEdge) {
          // Update home edge type
          if (typeof updateHomeEdgeType === "function") {
            updateHomeEdgeType(STATE.selectedEdge, btn.dataset.type);
          } else {
            console.warn("updateHomeEdgeType function not found");
          }
        } else {
          // Update task edge type
          STATE.selectedEdge.type = btn.dataset.type;
          STATE.selectedEdge._path.dataset.type = btn.dataset.type;
          applyEdgeStyle(STATE.selectedEdge._path, btn.dataset.type);
        }

        edgePopover
          .querySelectorAll(".edge-popover-btn[data-type]")
          .forEach((b) => {
            b.classList.toggle("active", b.dataset.type === btn.dataset.type);
          });
      });
    });
  $("#deleteEdgeBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    if (!STATE.selectedEdge) return;

    // Check if this is a home edge (between projects) or a task edge
    const isHomeEdge = STATE.selectedEdge._path?.dataset.homeEdge === "1";

    if (isHomeEdge) {
      // Delete home edge
      if (typeof deleteHomeEdge === "function") {
        deleteHomeEdge(STATE.selectedEdge);
      } else {
        console.warn("deleteHomeEdge function not found");
      }
    } else {
      // Delete task edge
      deleteEdge(STATE.selectedEdge);
    }
  });
}
