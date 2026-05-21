/**
 * Lunariel Spirit — the guardian's geometric presence.
 *
 * An ellipsoid body built from 9 meridian curves + 3 diagonal cross-ellipses.
 * A glowing core blooms outward with flat rings; the innermost dot is a small 3D sphere.
 * Two orbital rings spin around the body; breathing side fins flare.
 *
 * Active: camera orbits, body floats, core blazes, fins flare.
 * At rest: smooth lerp back to frontal reference pose, faint shimmer.
 */
import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Props {
  isActive: boolean;
}

const W = 1380;
const H = 1680;

const C = {
  body:    0xa8ccff,
  diag:    0x90b8f0,
  fin:     0x95c8ee,
  core:    0xe8f4ff,
  ring1:   0x7098d8,
  ring2:   0x80a8e8,
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

/** Circle in the XZ plane (latitude ring at given Y). */
function latRingXZ(r: number, y: number, n = 56): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(t) * r, y, Math.sin(t) * r));
  }
  return new THREE.BufferGeometry().setFromPoints(pts);
}

export function LunarielSpirit({ isActive }: Props) {
  const mountRef  = useRef<HTMLDivElement>(null);
  const activeRef = useRef(isActive);

  useEffect(() => { activeRef.current = isActive; }, [isActive]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── renderer ──────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width  = "100%";
    renderer.domElement.style.height = "100%";
    mount.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, W / H, 0.1, 50);

    function applySize(w: number, h: number) {
      if (w < 1 || h < 1) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    applySize(mount.clientWidth || W, mount.clientHeight || H);

    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      applySize(Math.round(width), Math.round(height));
    });
    ro.observe(mount);
    camera.position.set(0, 0.1, 3.1);
    camera.lookAt(0, 0.05, 0);

    // ── spirit group ──────────────────────────────────────────────────────
    const spirit = new THREE.Group();
    scene.add(spirit);

    const BODY_RX = 0.37;
    const BODY_RY = 0.61;

    // ── meridian lines (9 vertical ellipses — the longitude grid) ─────────
    const bodyGroup = new THREE.Group();
    spirit.add(bodyGroup);
    for (let i = 0; i < 9; i++) {
      const angle   = (i / 9) * Math.PI;
      const opacity = i === 0 ? 0.88 : 0.36;
      const g = new THREE.Group();
      g.rotation.y = angle;
      g.add(new THREE.LineLoop(ellipseXY(BODY_RX, BODY_RY), mat(C.body, opacity, i !== 0)));
      bodyGroup.add(g);
    }

    // ── diagonal ellipses (3 cross-planes — sacred-geometry orb effect) ──
    // Each is a circle in XY plane, then rotated into a diagonal orientation.
    const diagDefs = [
      { rx: 0.9, ry: 0.52, ax: 0.33 * Math.PI, az: 0.0,          op: 0.28 },  // tilted fore-aft
      { rx: 0.9, ry: 0.52, ax: 0.0,            az: 0.33 * Math.PI, op: 0.28 }, // tilted side-to-side
      { rx: 0.7, ry: 0.42, ax: 0.22 * Math.PI, az: 0.25 * Math.PI, op: 0.20 }, // cross-diagonal
    ] as const;
    for (const { rx, ry, ax, az, op } of diagDefs) {
      // Build ellipse whose semi-major axis equals BODY_RX when un-tilted
      const scaledRX = BODY_RX * rx;
      const scaledRY = BODY_RY * ry;
      const g = new THREE.Group();
      g.rotation.x = ax;
      g.rotation.z = az;
      g.add(new THREE.LineLoop(ellipseXY(scaledRX, scaledRY, 64), mat(C.diag, op, true)));
      spirit.add(g);
    }

    // ── side fins ─────────────────────────────────────────────────────────
    const finL = new THREE.Line(arcXY(0.18, 0.28,  Math.PI * 0.5, Math.PI * 1.5), mat(C.fin, 0.65));
    const finR = new THREE.Line(arcXY(0.18, 0.28, -Math.PI * 0.5, Math.PI * 0.5), mat(C.fin, 0.65));
    finL.position.x = -BODY_RX;
    finR.position.x =  BODY_RX;
    spirit.add(finL, finR);

    // ── glowing core — innermost dot is a small 3D sphere; outer rings stay flat in XY ─
    const core = new THREE.Group();
    spirit.add(core);

    const INNER_R = 0.038;
    const innerSphere = new THREE.Group();
    core.add(innerSphere);

    // Innermost core: small 3D sphere (vertical meridians only).
    // Skip angles where the meridian lies flat in XZ — those looked like
    // extra latitude rings on the ellipsoid body.
    const MERIDIAN_COUNT = 10;
    for (let i = 0; i < MERIDIAN_COUNT; i++) {
      const angle = (i / MERIDIAN_COUNT) * Math.PI;
      if (Math.abs(Math.cos(angle)) < 0.12) continue;

      const opacity = Math.abs(Math.sin(angle)) < 0.25 ? 1.0 : 0.48;
      const g = new THREE.Group();
      g.rotation.y = angle;
      g.add(
        new THREE.LineLoop(
          ellipseXY(INNER_R, INNER_R, 28),
          mat(C.core, opacity, true)
        )
      );
      innerSphere.add(g);
    }

    // Oblique meridians for depth (tilted, not horizontal)
    for (const tilt of [0.62, -0.62]) {
      const g = new THREE.Group();
      g.rotation.x = tilt;
      g.add(
        new THREE.LineLoop(ellipseXY(INNER_R, INNER_R, 24), mat(C.core, 0.42, true))
      );
      innerSphere.add(g);
    }

    const coreRings: [number, number][] = [
      [0.065, 0.82],
      [0.100, 0.58],
      [0.148, 0.34],
      [0.215, 0.18],
      [0.305, 0.09],
      [0.420, 0.04],
    ];
    for (const [r, op] of coreRings) {
      core.add(new THREE.LineLoop(ellipseXY(r, r, 32), mat(C.core, op, true)));
    }

    // ── orbital rings ──────────────────────────────────────────────────────
    const ring1 = new THREE.Group();
    const r1body = new THREE.Group();
    r1body.rotation.z = 0.35;
    r1body.add(new THREE.LineLoop(latRingXZ(0.82, 0), mat(C.ring1, 0.52)));
    r1body.add(new THREE.LineLoop(latRingXZ(0.87, 0), mat(C.ring1, 0.14, true)));
    ring1.add(r1body);
    scene.add(ring1);

    const ring2 = new THREE.Group();
    const r2body = new THREE.Group();
    r2body.rotation.x =  0.50;
    r2body.rotation.z = -0.20;
    r2body.add(new THREE.LineLoop(latRingXZ(0.66, 0), mat(C.ring2, 0.42)));
    ring2.add(r2body);
    scene.add(ring2);

    // ── animation loop (phase offsets preserve continuity across state changes) ─
    const clock = new THREE.Clock();
    let raf: number;

    const ORBIT_R = 3.1;
    const ORBIT_ω = 0.12;
    const REST_CAM = { x: 0, y: 0.1, z: 3.1 };
    const REST_RING2_Y = 0.85;

    let wasActive = false;
    let orbitAngleOffset = 0;
    let ring1Phase = 0;
    let ring2Phase = REST_RING2_Y;
    let spiritRotPhase = 0;
    let floatPhase = 0;
    let corePulsePhase = 0;
    let finBreathPhase = 0;

    /** Align driven motion with whatever pose the scene is in right now. */
    function syncPhasesFromCurrentPose(t: number) {
      orbitAngleOffset = Math.atan2(camera.position.x, camera.position.z) - t * ORBIT_ω;

      ring1Phase = ring1.rotation.y - t * 0.28;
      ring2Phase = ring2.rotation.y + t * 0.20;

      spiritRotPhase = spirit.rotation.y - t * 0.04;

      const floatY = spirit.position.y;
      floatPhase =
        Math.abs(floatY) < 0.06
          ? Math.asin(THREE.MathUtils.clamp(floatY / 0.06, -1, 1)) - t * 0.75
          : 0;

      const coreS = core.scale.x;
      corePulsePhase =
        Math.asin(THREE.MathUtils.clamp((coreS - 1) / 0.22, -1, 1)) - t * 1.9;

      const finNorm = (finL.scale.x - 1) / 0.28;
      finBreathPhase =
        Math.asin(THREE.MathUtils.clamp(finNorm, -1, 1)) - t * 0.85;
    }

    function tick() {
      raf = requestAnimationFrame(tick);
      const t      = clock.getElapsedTime();
      const active = activeRef.current;

      if (active !== wasActive) {
        if (active) {
          syncPhasesFromCurrentPose(t);
        } else {
          // Entering rest — continue core shimmer from current scale
          const coreS = core.scale.x;
          corePulsePhase =
            Math.asin(THREE.MathUtils.clamp((coreS - 1) / 0.05, -1, 1)) - t * 0.55;
        }
        wasActive = active;
      }

      if (active) {
        const θ = t * ORBIT_ω + orbitAngleOffset;
        const targetX = Math.sin(θ) * ORBIT_R;
        const targetZ = Math.cos(θ) * ORBIT_R;
        const targetY = 0.15;

        // Ease camera onto the orbit from its present position (no snap)
        const camα = 0.08;
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, camα);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, camα);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, camα);
        camera.lookAt(0, 0.05, 0);

        spirit.position.y = Math.sin(t * 0.75 + floatPhase) * 0.06;
        core.scale.setScalar(1 + Math.sin(t * 1.9 + corePulsePhase) * 0.22);

        const b = 1 + Math.sin(t * 0.85 + finBreathPhase) * 0.28;
        finL.scale.x = b;
        finR.scale.x = b;

        ring1.rotation.y = t * 0.28 + ring1Phase;
        ring2.rotation.y = -t * 0.20 + ring2Phase;
        spirit.rotation.y = t * 0.04 + spiritRotPhase;
      } else {
        const α = 0.025;
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, REST_CAM.x, α);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, REST_CAM.z, α);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, REST_CAM.y, α);
        camera.lookAt(0, 0.05, 0);

        spirit.position.y = THREE.MathUtils.lerp(spirit.position.y, 0, α);
        spirit.rotation.y = THREE.MathUtils.lerp(spirit.rotation.y, 0, α);

        ring1.rotation.y = THREE.MathUtils.lerp(ring1.rotation.y, 0, 0.015);
        ring2.rotation.y = THREE.MathUtils.lerp(ring2.rotation.y, REST_RING2_Y, 0.015);

        finL.scale.x = THREE.MathUtils.lerp(finL.scale.x, 1, α);
        finR.scale.x = THREE.MathUtils.lerp(finR.scale.x, 1, α);

        const restCore = 1 + Math.sin(t * 0.55 + corePulsePhase) * 0.05;
        core.scale.x = THREE.MathUtils.lerp(core.scale.x, restCore, α);
        core.scale.y = core.scale.x;
        core.scale.z = core.scale.x;
      }

      renderer.render(scene, camera);
    }

    tick();

    // ── cleanup ───────────────────────────────────────────────────────────
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
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden
      style={{ width: "100%", height: "100%" }}
    />
  );
}
