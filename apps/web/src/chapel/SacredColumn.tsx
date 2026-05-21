/**
 * Sacred Column — a ritual pillar flanking the chapel.
 *
 * Seven wireframe rings in classical column proportions (widest at
 * base and capital, narrowest mid-shaft), joined by four curved
 * fluting lines. A glowing node pulses at each ring level at the same
 * 1.9 Hz as Lunariel's core — all presences breathe together.
 *
 * The component is fully responsive: a ResizeObserver tracks the
 * container div (sized by CSS) and the Three.js renderer, camera, and
 * geometry scale update accordingly without destroying the scene.
 */
import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Props {
  isActive: boolean;
  mirror?: boolean;
}

// World-space constants (invariant across resizes)
const WORLD_HALF_H = 2.75;           // orthographic half-height = covers ±2.2 ring span + padding
const NAT_MAX_R    = 0.34;           // natural ring max radius (baseline for x-scaling)
const FILL_RATIO   = 0.82;           // rings fill this fraction of the camera half-width

const RINGS = [
  { y: -2.20, r: 0.34 },
  { y: -1.47, r: 0.27 },
  { y: -0.73, r: 0.21 },
  { y:  0.00, r: 0.19 },
  { y:  0.73, r: 0.21 },
  { y:  1.47, r: 0.27 },
  { y:  2.20, r: 0.34 },
] as const;

const C = { ring: 0xa8ccff, dim: 0x5588bb, glow: 0xe8f4ff } as const;

function mat(
  color: number, opacity: number, additive = false
): THREE.LineBasicMaterial {
  return new THREE.LineBasicMaterial({
    color, transparent: true, opacity,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: false,
  });
}

function circleXY(r: number, n = 48): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const θ = (i / n) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(θ) * r, Math.sin(θ) * r, 0));
  }
  return new THREE.BufferGeometry().setFromPoints(pts);
}

export function SacredColumn({ isActive, mirror = false }: Props) {
  const wrapRef   = useRef<HTMLDivElement>(null);
  const activeRef = useRef(isActive);
  useEffect(() => { activeRef.current = isActive; }, [isActive]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    // ── renderer ────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Renderer canvas fills the wrapper via CSS
    renderer.domElement.style.width  = "100%";
    renderer.domElement.style.height = "100%";
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    // Orthographic: height always WORLD_HALF_H*2; width scales with aspect ratio
    const camera = new THREE.OrthographicCamera(
      -WORLD_HALF_H, WORLD_HALF_H,   // will be updated on resize
      WORLD_HALF_H, -WORLD_HALF_H,
      0.1, 10
    );
    camera.position.z = 5;

    // ── geometry group (x-scaled on resize to fill column width) ────────────
    const colGroup = new THREE.Group();
    scene.add(colGroup);

    // Ring loops
    const ringLoops: THREE.LineLoop[] = [];
    for (const { y, r } of RINGS) {
      const loop = new THREE.LineLoop(circleXY(r), mat(C.ring, 0.55));
      loop.position.y = y;
      colGroup.add(loop);
      ringLoops.push(loop);
    }

    // Fluting lines — 4 vertical curves through the ring edge points
    const fluteAngles = [0, Math.PI, Math.PI * 0.52, Math.PI * 1.48];
    for (const θ of fluteAngles) {
      const pts = RINGS.map(({ y, r }) =>
        new THREE.Vector3(Math.cos(θ) * r, y, Math.sin(θ) * r * 0.5)
      );
      colGroup.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        mat(C.dim, 0.38)
      ));
    }

    // Glow nodes — tiny pulsing circles at each ring centre
    const glowNodes: THREE.Group[] = [];
    for (const { y } of RINGS) {
      const node = new THREE.Group();
      node.position.y = y;
      ([0.026, 0.048] as const).forEach((r, i) => {
        const ops = [1.0, 0.35] as const;
        node.add(new THREE.LineLoop(circleXY(r, 20), mat(C.glow, ops[i], true)));
      });
      colGroup.add(node);
      glowNodes.push(node);
    }

    // ── resize logic ────────────────────────────────────────────────────────
    function applySize(W: number, H: number) {
      if (W < 1 || H < 1) return;
      renderer.setSize(W, H, false); // false = don't update canvas CSS (we handle it)

      // Update camera aspect
      const cameraHW = WORLD_HALF_H * (W / H);
      camera.left   = -cameraHW;
      camera.right  =  cameraHW;
      camera.top    =  WORLD_HALF_H;
      camera.bottom = -WORLD_HALF_H;
      camera.updateProjectionMatrix();

      // Scale geometry in X to fill the column width (non-uniform — rings become ellipses,
      // which looks correct for a cylinder viewed frontally)
      const xScale = (cameraHW * FILL_RATIO) / NAT_MAX_R;
      colGroup.scale.x = xScale * (mirror ? -1 : 1);
    }

    // Initial measurement (may be 0 on first paint; ResizeObserver handles it)
    applySize(wrap.clientWidth, wrap.clientHeight);

    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      applySize(Math.round(width), Math.round(height));
    });
    ro.observe(wrap);

    // ── animation loop ───────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let raf: number;

    function tick() {
      raf = requestAnimationFrame(tick);
      const t      = clock.getElapsedTime();
      const active = activeRef.current;

      if (active) {
        // Pulse at the spirit's core frequency (1.9 Hz)
        const pulse = 1 + Math.sin(t * 1.9) * 0.24;
        for (const node of glowNodes) node.scale.setScalar(pulse);
        // Gentle lateral sway following fin-breath frequency (0.85 Hz)
        const sway = Math.sin(t * 0.85) * 0.025;
        for (const loop of ringLoops) loop.position.x = sway;
      } else {
        // Very faint slow shimmer at rest (same freq as spirit's rest core: 0.55 Hz)
        const restPulse = 1 + Math.sin(t * 0.55) * 0.07;
        for (const node of glowNodes) node.scale.setScalar(restPulse);
        for (const loop of ringLoops) {
          loop.position.x = THREE.MathUtils.lerp(loop.position.x, 0, 0.04);
        }
      }

      renderer.render(scene, camera);
    }

    tick();

    // ── cleanup ─────────────────────────────────────────────────────────────
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      scene.traverse((obj: THREE.Object3D) => {
        if (obj instanceof THREE.Line || obj instanceof THREE.LineLoop) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m: THREE.Material) => m.dispose());
        }
      });
      renderer.dispose();
      if (wrap.contains(renderer.domElement)) wrap.removeChild(renderer.domElement);
    };
  }, [mirror]);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      style={{ width: "100%", height: "100%" }}
    />
  );
}
