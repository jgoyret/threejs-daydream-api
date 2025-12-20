import React, { useState, useEffect } from "react";

export default function HUD({ avatar = "/avatar.png" }) {
  const [hp, setHp] = useState(100);
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "KeyH") setHp((h) => Math.max(0, h - 10));
      if (e.code === "KeyJ") setHp((h) => Math.min(100, h + 10));
    };
    window.addEventListener("keydown", onKey);

    const onDamage = (ev) => {
      const amt = ev.detail && ev.detail.amount ? ev.detail.amount : 0;
      setHp((h) => Math.max(0, h - amt));
    };
    window.addEventListener("player-damage", onDamage);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("player-damage", onDamage);
    };
  }, []);

  useEffect(() => {
    const handleUpdateCoords = (e) => {
      // console.log("Received coords:", e.detail); // Debug
      setCoords(e.detail);
    };

    window.addEventListener("update-coords", handleUpdateCoords);
    return () =>
      window.removeEventListener("update-coords", handleUpdateCoords);
  }, []);

  const SLOT_COUNT = 6;
  const [selected, setSelected] = useState(0);
  const [activeIndex, setActiveIndex] = useState(null);
  const [equippedItems, setEquippedItems] = useState({});

  useEffect(() => {
    let last = 0;
    function onWheel(e) {
      const now = performance.now();
      if (now - last < 120) return;
      last = now;
      const dir = e.deltaY > 0 ? 1 : -1;
      setSelected((s) => {
        const next = (s + dir + SLOT_COUNT) % SLOT_COUNT;
        window.dispatchEvent(
          new CustomEvent("quickbar-update", {
            detail: { selected: next, activeIndex },
          })
        );
        return next;
      });
    }

    function onKey(e) {
      if (e.code === "KeyE") {
        setActiveIndex((cur) => {
          const next = cur === selected ? null : selected;
          window.dispatchEvent(
            new CustomEvent("quickbar-update", {
              detail: { selected, activeIndex: next },
            })
          );
          return next;
        });
      }
      if (/Digit[1-6]/.test(e.code)) {
        const n = parseInt(e.code.replace("Digit", ""), 10) - 1;
        if (!Number.isNaN(n)) {
          setSelected(n);
          window.dispatchEvent(
            new CustomEvent("quickbar-update", {
              detail: { selected: n, activeIndex },
            })
          );
        }
      }
    }

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    window.dispatchEvent(
      new CustomEvent("quickbar-update", { detail: { selected, activeIndex } })
    );

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, [selected, activeIndex]);

  useEffect(() => {
    function onQuickbarUpdate(e) {
      const { selected, activeIndex, equippedItem } = e.detail || {};
      if (equippedItem) {
        setEquippedItems((prev) => ({
          ...prev,
          [selected]: equippedItem,
        }));
      }
    }

    window.addEventListener("quickbar-update", onQuickbarUpdate);
    return () =>
      window.removeEventListener("quickbar-update", onQuickbarUpdate);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        left: 12,
        bottom: 12,
        zIndex: 150,
        pointerEvents: "none",
      }}
    >
      <style>{`
        .hud-panel { display:flex; gap:12px; align-items:center; padding:10px; background:linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.4)); border-radius:12px; color:#fff; font-family:sans-serif; min-width:220px; }
        .hud-avatar { width:86px; height:86px; border-radius:50%; object-fit:cover; border:2px solid rgba(255,255,255,0.95); box-shadow:0 4px 10px rgba(0,0,0,0.45); }
        .hp-wrap { display:flex; flex-direction:column; gap:6px; min-width:120px; }
        .hp-bar { height:18px; width:140px; background: rgba(255,255,255,0.06); border-radius:12px; position:relative; overflow:hidden; }
        .hp-fill { height:100%; background:linear-gradient(90deg,#ff4d4f,#ff7a45); border-radius:12px; transition:width 280ms; }
        .hp-shine { position:absolute; top:0; left:-40%; width:40%; height:100%; background:linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.45), rgba(255,255,255,0)); transform:skewX(-20deg); animation:sheen 1.6s linear infinite; mix-blend-mode:overlay; }
        @keyframes sheen { from { left:-60%; } to { left:120%; } }
        .hp-text { font-size:12px; opacity:0.95; }

        .quickbar { position: fixed; right: 16px; top: 50%; transform: translateY(-50%); display:flex; flex-direction:column; gap:8px; z-index:150; pointer-events:none; align-items:flex-end; }
        .quickbar-hint { color: rgba(255,255,255,0.75); font-size:12px; align-self:flex-end; margin-bottom:6px; }
        .slot { width:58px; height:58px; background:linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.35)); border-radius:8px; border:1px solid rgba(255,255,255,0.04); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:600; box-shadow:0 6px 16px rgba(0,0,0,0.45); transition: transform 140ms ease, box-shadow 140ms ease; position:relative; }
        .slot.selected { transform: scale(1.06); }
        .slot.active { outline: 2px solid rgba(80,220,120,0.95); box-shadow:0 10px 22px rgba(0,0,0,0.6), 0 0 12px rgba(80,220,120,0.08); }
        .slot .dot { position:absolute; right:6px; top:6px; width:10px; height:10px; border-radius:50%; background:rgba(80,220,120,0.95); box-shadow:0 2px 6px rgba(80,220,120,0.35); }
        .slot .label { font-size:14px; opacity:0.95; pointer-events:none; }

        .interaction-circles {
          position: fixed;
          right: 24px;
          bottom: 24px;
          display: flex;
          gap: 12px;
        }
        .circle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(0,0,0,0.4);
          border: 2px solid rgba(255,255,255,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          opacity: 0.6;
          transition: opacity 0.2s;
        }
        .circle.active {
          opacity: 1;
          border-color: rgba(255,255,255,0.4);
        }

        .coords-display {
          position: fixed;
          top: 16px;
          left: 16px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 14px;
          z-index: 150;
          pointer-events: none;
        }
      `}</style>

      {/* Coordenadas */}
      {coords && (
        <div className="coords-display">
          X: {coords.x} Y: {coords.y} Z: {coords.z}
        </div>
      )}

      {/* <div className="hud-panel">
        <img src={avatar} alt="avatar" className="hud-avatar" />
        <div className="hp-wrap">
          <div className="hp-bar" aria-hidden>
            <div className="hp-fill" style={{ width: `${hp}%` }} />
            <div className="hp-shine" />
          </div>
          <div className="hp-text">{hp} / 100</div>
        </div>
      </div> */}

      <div className="quickbar" aria-hidden>
        <div className="quickbar-hint">Wheel to change · E to toggle</div>
        {Array.from({ length: SLOT_COUNT }).map((_, i) => {
          const isSelected = i === selected;
          const isActive = activeIndex === i;
          const hasItem = equippedItems[i];
          const classes = `slot ${isSelected ? "selected" : ""} ${
            isActive ? "active" : ""
          }`;
          return (
            <div key={i} className={classes} style={{ position: "relative" }}>
              <div className="label">
                {hasItem ? (hasItem === "sword" ? "⚔️" : i + 1) : i + 1}
              </div>
              {isActive && <div className="dot" />}
            </div>
          );
        })}
      </div>

      <div className="interaction-circles">
        <div className={`circle`}>R</div>
        <div className={`circle`}>F</div>
      </div>
    </div>
  );
}
