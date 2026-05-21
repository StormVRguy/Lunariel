/**
 * Lunariel Spirit — the guardian's geometric presence.
 *
 * A tiny blue spirit made of light-lines: 3D meridian ellipsoid body,
 * glowing core, breathing side fins, and two orbiting rings.
 * Rendered with Three.js entirely from procedural geometry — no meshes,
 * no textures, only lines and additive glow against eigengrau.
 *
 * When the vigil is active the camera slowly orbits; everything breathes.
 * When static the spirit rests in its reference pose.
 */
import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Props {
  isActive: boolean;
}

const W = 130;
const H = 220;

// Against eigengrau dark: lines are bright pearl-blue
const C = {
  body:     0x88bbee,
  bodyDim:  0x3366aa,
  fin:      0x77aadd,
  core:     0xcceeff,
  ring1:    0x5588cc,
  ring2:    0x6699dd,
} as const;

function mat(color: number, opacity: number, additive = false): THREE.LineBasicMaterial {
  return new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: false,
  });
}

/** Closed ellipse in the XY plane. */
function ellipseXY(rx: number, ry: number, n = 64): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(t) * rx, Math.sin(t) * ry, 0));
  }
  return new THREE.BufferGeometry().setFromPoints(pts);
}

/** Open arc in the XY plane. */
function arcXY(rx: number, ry: number, a0: number, a1: number, n = 32): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = a0 + (i / n) * (a1 - a0);
    pts.push(new THREE.Vector3(Math.cos(t) * rx, Math.sin(t) * ry, 0));
  }
  return new THREE.BufferGeometry().setFromPoints(pts);
}

/** Circle in the XZ plane (horizontal ring). */
function ringXZ(r: number, n = 64): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(t) * r, 0, Math.sin(t) * r));
  }
  return new THREE.BufferGeometry().setFromPoints(pts);
}

export function LunarielSpirit({ isActive }: Props) {
  const mountRef  = useRef<HTMLDivElement>(null);
  const activeRef = useRef(isActive);

  useEffect(() => { activeRef.current = isActive; }, [isActive]);

  useEffect(() => {
    // Capture mount node so the cleanup closure always references it correctly
    const mount = mountRef.current;
    if (!mount) return;

    // ── renderer ──────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 50);
    camera.position.set(0, 0.1, 2.2);
    camera.lookAt(0, 0.05, 0);

    // ── spirit group ──────────────────────────────────────────────────────
    const spirit = new THREE.Group();
    scene.add(spirit);

    // 3-D ellipsoid body — 9 meridians rotated 20° apart around the Y-axis.
    // Together they trace the surface of the oval like a celestial globe.
    const bodyGroup = new THREE.Group();
    spirit.add(bodyGroup);
    const MERIDIANS = 9;
    for (let i = 0; i < MERIDIANS; i++) {
      const angle  = (i / MERIDIANS) * Math.PI; // 0 … 160°  (180° duplicates 0°)
      // Opacity: front-facing meridians slightly brighter
      const opacity = i === 0 ? 0.85 : 0.38;
      const additive = i !== 0;
      const g = new THREE.Group();
      g.rotation.y = angle;
      g.add(new THREE.LineLoop(ellipseXY(0.28, 0.46), mat(C.body, opacity, additive)));
      bodyGroup.add(g);
    }
    // Equatorial halo ring (faint outer glow)
    spirit.add(new THREE.LineLoop(ellipseXY(0.30, 0.48), mat(C.bodyDim, 0.18, true)));

    // Side fins — half-arcs mounted at the body edges; scale.x breathes
    const finL = new THREE.Line(arcXY(0.14, 0.22,  Math.PI * 0.5, Math.PI * 1.5), mat(C.fin, 0.65));
    const finR = new THREE.Line(arcXY(0.14, 0.22, -Math.PI * 0.5, Math.PI * 0.5), mat(C.fin, 0.65));
    finL.position.x = -0.28;
    finR.position.x =  0.28;
    spirit.add(finL, finR);

    // Glowing core — four concentric rings, additive for soft halo
    const core = new THREE.Group();
    spirit.add(core);
    ([0.04, 0.07, 0.11, 0.16] as const).forEach((r, i) => {
      const ops = [1.0, 0.65, 0.32, 0.13] as const;
      core.add(new THREE.LineLoop(ellipseXY(r, r, 32), mat(C.core, ops[i], true)));
    });

    // ── orbital rings ──────────────────────────────────────────────────────
    const ring1 = new THREE.Group();
    const r1body = new THREE.Group();
    r1body.rotation.z = 0.35;
    r1body.add(new THREE.LineLoop(ringXZ(0.62), mat(C.ring1, 0.50)));
    r1body.add(new THREE.LineLoop(ringXZ(0.65), mat(C.ring1, 0.13, true)));
    ring1.add(r1body);
    scene.add(ring1);

    const ring2 = new THREE.Group();
    const r2body = new THREE.Group();
    r2body.rotation.x =  0.50;
    r2body.rotation.z = -0.20;
    r2body.add(new THREE.LineLoop(ringXZ(0.50), mat(C.ring2, 0.40)));
    ring2.add(r2body);
    scene.add(ring2);

    // ── animation loop ────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let raf: number;

    function tick() {
      raf = requestAnimationFrame(tick);
      const t      = clock.getElapsedTime();
      const active = activeRef.current;

      if (active) {
        const R = 2.2, ω = 0.12;
        camera.position.x = Math.sin(t * ω) * R;
        camera.position.z = Math.cos(t * ω) * R;
        camera.position.y = 0.15;
        camera.lookAt(0, 0.05, 0);

        spirit.position.y = Math.sin(t * 0.75) * 0.055;
        core.scale.setScalar(1 + Math.sin(t * 1.9) * 0.14);

        const b = 1 + Math.sin(t * 0.85) * 0.28;
        finL.scale.x = b;
        finR.scale.x = b;

        ring1.rotation.y =  t * 0.28;
        ring2.rotation.y = -t * 0.20;
      }

      renderer.render(scene, camera);
    }

    tick();

    // ── cleanup ───────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(raf);
      scene.traverse((obj: THREE.Object3D) => {
        if (obj instanceof THREE.Line || obj instanceof THREE.LineLoop) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m: THREE.Material) => m.dispose());
        }
      });
      renderer.dispose();
      // Use captured reference — mountRef.current may be null during cleanup
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden
      style={{ width: W, height: H, flexShrink: 0, alignSelf: "center" }}
    />
  );
}
