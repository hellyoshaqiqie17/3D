'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useConfiguratorStore } from '@/lib/configurator-store';

export function CameraManager() {
  const { camera, scene, gl } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const activeCameraPreset = useConfiguratorStore((s) => s.activeCameraPreset);
  const cameraPresetVersion = useConfiguratorStore((s) => s.cameraPresetVersion);
  const cameraFov = useConfiguratorStore((s) => s.cameraFov);
  const setCameraFov = useConfiguratorStore((s) => s.setCameraFov);
  const houseSize = useConfiguratorStore((s) => s.houseSize);
  const setRoofHidden = useConfiguratorStore((s) => s.setRoofHidden);
  const setEnvironmentHidden = useConfiguratorStore((s) => s.setEnvironmentHidden);
  const setCameraMode = useConfiguratorStore((s) => s.setCameraMode);
  const isAutoRotate = useConfiguratorStore((s) => s.isAutoRotate);
  const autoRotateSpeed = useConfiguratorStore((s) => s.autoRotateSpeed);
  const isLookAround360 = useConfiguratorStore((s) => s.isLookAround360);

  const targetCamPos = useRef(new THREE.Vector3(14, 8, 14));
  const targetLookAt = useRef(new THREE.Vector3(0, 1.5, 0));
  const isTransitioning = useRef(false);
  const inPlaceYaw = useRef(0);
  const isInteracting = useRef(false);

  // In-place 360 Look Around refs
  const anchorPos = useRef(new THREE.Vector3());
  const currentYaw = useRef(0);
  const currentPitch = useRef(0);
  const targetYaw = useRef(0);
  const targetPitch = useRef(0);
  const isDraggingPointer = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  const isInPlacePreset =
    activeCameraPreset === 'interior' ||
    activeCameraPreset === 'living' ||
    activeCameraPreset === 'bedroom' ||
    activeCameraPreset === 'facade';

  // Synchronize anchor and yaw with camera orientation
  useEffect(() => {
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    inPlaceYaw.current = Math.atan2(dir.x, -dir.z);
    anchorPos.current.copy(camera.position);
    targetYaw.current = Math.atan2(dir.x, -dir.z);
    currentYaw.current = targetYaw.current;
    targetPitch.current = Math.asin(THREE.MathUtils.clamp(dir.y, -0.99, 0.99));
    currentPitch.current = targetPitch.current;
  }, [activeCameraPreset, isLookAround360, camera]);

  // Pointer drag listeners for manual 360 rotation anchored at a single point
  useEffect(() => {
    const glDom = gl.domElement;
    if (!glDom) return;

    if (isLookAround360) {
      isTransitioning.current = false;
      anchorPos.current.copy(camera.position);
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      targetYaw.current = Math.atan2(dir.x, -dir.z);
      currentYaw.current = targetYaw.current;
      targetPitch.current = Math.asin(THREE.MathUtils.clamp(dir.y, -0.99, 0.99));
      currentPitch.current = targetPitch.current;
      glDom.style.cursor = 'grab';
    } else {
      glDom.style.cursor = 'default';
      if (controlsRef.current) {
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        controlsRef.current.target.copy(camera.position).addScaledVector(dir, 3.0);
        controlsRef.current.update();
      }
    }

    const onPointerDown = (e: PointerEvent) => {
      if (!isLookAround360 || e.button !== 0) return;
      isDraggingPointer.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      glDom.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isLookAround360 || !isDraggingPointer.current) return;
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };

      targetYaw.current -= dx * 0.0035;
      targetPitch.current += dy * 0.0035;
      targetPitch.current = Math.max(-1.48, Math.min(1.48, targetPitch.current));
    };

    const onPointerUp = () => {
      if (!isLookAround360) return;
      isDraggingPointer.current = false;
      glDom.style.cursor = 'grab';
    };

    const onWheel = (e: WheelEvent) => {
      if (!isLookAround360) return;
      e.preventDefault();
      const currentFov = (camera as THREE.PerspectiveCamera).fov || 60;
      const deltaFov = e.deltaY > 0 ? 3 : -3;
      setCameraFov(Math.max(35, Math.min(80, currentFov + deltaFov)));
    };

    glDom.addEventListener('pointerdown', onPointerDown);
    glDom.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      glDom.removeEventListener('pointerdown', onPointerDown);
      glDom.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [isLookAround360, gl, camera, setCameraFov]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__THREE_SCENE__ = scene;
      (window as any).__THREE_CAMERA__ = camera;
      (window as any).__THREE_CONTROLS__ = controlsRef.current;
    }
  }, [scene, camera]);

  // Dynamic calculation of camera viewpoints based on actual house geometry
  const calculatePresetVectors = useCallback(
    (presetId: string) => {
      // Calibrated house center and ground levels from architectural mesh bounds
      const houseX = -5.41;
      const houseY = 0.77; // Floor height inside house
      const houseZ = -0.39;
      const eyeLevel = houseY + 1.45; // ~2.22m eye level inside house

      switch (presetId) {
        case 'exterior':
          // Standard perspective exterior view of house
          setCameraFov(52);
          setCameraMode('orbit');
          return {
            pos: new THREE.Vector3(5.0, 7.5, 8.5),
            target: new THREE.Vector3(houseX, 1.8, houseZ),
          };

        case 'interior':
        case 'living':
          // RUANG TAMU: Eye-level inside living room facing lounge area
          setRoofHidden(false);
          setCameraFov(62);
          setCameraMode('orbit');
          return {
            pos: new THREE.Vector3(-3.5, eyeLevel, 1.5),
            target: new THREE.Vector3(-5.2, eyeLevel - 0.1, -0.5),
          };

        case 'bedroom':
          // KAMAR TIDUR: Standing inside bedroom looking across the bedroom
          setRoofHidden(false);
          setCameraFov(62);
          setCameraMode('orbit');
          return {
            pos: new THREE.Vector3(-6.8, eyeLevel, 0.8),
            target: new THREE.Vector3(-8.0, eyeLevel - 0.1, 1.8),
          };

        case 'dollhouse':
          // PERSPEKTIF ATAS (Buka Atap): 45-degree top-down angled view directly centered on the house
          setRoofHidden(true);
          setCameraFov(52);
          setCameraMode('orbit');
          return {
            pos: new THREE.Vector3(houseX, 11.5, houseZ + 6.0),
            target: new THREE.Vector3(houseX, houseY, houseZ),
          };

        case 'facade':
          // FASAD DEPAN: Street/driveway eye-level facing front porch, carport, and main entrance
          setCameraFov(52);
          setCameraMode('orbit');
          return {
            pos: new THREE.Vector3(0.5, 2.8, 9.5),
            target: new THREE.Vector3(-1.8, 1.9, 1.2),
          };

        case 'top':
          // DENAH ATAS: 90-degree straight top-down view centered exactly over the house
          setRoofHidden(true);
          setEnvironmentHidden(true);
          setCameraFov(48);
          setCameraMode('orbit');
          return {
            pos: new THREE.Vector3(houseX, 15.0, houseZ + 0.01),
            target: new THREE.Vector3(houseX, houseY, houseZ),
          };

        default:
          return {
            pos: new THREE.Vector3(5.0, 7.5, 8.5),
            target: new THREE.Vector3(houseX, 1.8, houseZ),
          };
      }
    },
    [setRoofHidden, setEnvironmentHidden, setCameraFov, setCameraMode]
  );

  useEffect(() => {
    const { pos, target } = calculatePresetVectors(activeCameraPreset);
    targetCamPos.current.copy(pos);
    targetLookAt.current.copy(target);
    isTransitioning.current = true;
  }, [activeCameraPreset, cameraPresetVersion, calculatePresetVectors]);

  // Double-Click to Teleport / Focus smoothly on any point in 3D
  useEffect(() => {
    const glDom = gl.domElement;
    if (!glDom) return;

    const handleDblClick = (e: MouseEvent) => {
      const rect = glDom.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(scene.children, true);
      const hit = intersects.find((i) => i.object.visible && !(i.object instanceof THREE.LineSegments));

      if (hit) {
        const point = hit.point;
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        dir.y = 0;
        dir.normalize();

        const isFloor = hit.face && hit.face.normal.y > 0.6;

        if (isFloor) {
          // Standing at clicked floor point at comfortable eye-level
          targetCamPos.current.set(point.x - dir.x * 2.5, 1.55, point.z - dir.z * 2.5);
          targetLookAt.current.set(point.x, 1.45, point.z);
          setCameraFov(62);
        } else {
          // Focus in front of clicked wall/object
          targetLookAt.current.copy(point);
          const camOffset = new THREE.Vector3();
          camera.getWorldDirection(camOffset);
          targetCamPos.current.copy(point).addScaledVector(camOffset, -2.5);
          if (targetCamPos.current.y < 0.3) targetCamPos.current.y = 0.3;
        }
        isTransitioning.current = true;
      }
    };

    glDom.addEventListener('dblclick', handleDblClick);
    return () => glDom.removeEventListener('dblclick', handleDblClick);
  }, [camera, scene, gl, setCameraFov]);

  // Gentle Walkthrough Navigation (WASD / Arrow Keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (!controlsRef.current) return;

      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3();
      right.crossVectors(forward, camera.up).normalize();

      const step = e.shiftKey ? 0.6 : 0.25;
      const moveVec = new THREE.Vector3();

      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
        moveVec.addScaledVector(forward, step);
      } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
        moveVec.addScaledVector(forward, -step);
      } else if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        moveVec.addScaledVector(right, -step);
      } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        moveVec.addScaledVector(right, step);
      } else if (e.key === 'e' || e.key === 'E') {
        moveVec.y += step * 0.5;
      } else if (e.key === 'q' || e.key === 'Q') {
        moveVec.y -= step * 0.5;
      }

      if (moveVec.lengthSq() > 0) {
        isTransitioning.current = false;
        camera.position.add(moveVec);
        if (camera.position.y < 0.25) camera.position.y = 0.25;
        anchorPos.current.copy(camera.position);
        controlsRef.current.target.add(moveVec);
        controlsRef.current.update();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [camera]);

  useFrame((_, delta) => {
    // 1. Dynamic FOV Interpolation
    if (camera instanceof THREE.PerspectiveCamera) {
      if (Math.abs(camera.fov - cameraFov) > 0.05) {
        camera.fov = THREE.MathUtils.lerp(camera.fov, cameraFov, Math.min(delta * 4, 0.2));
        camera.updateProjectionMatrix();
      }
    }

    // 2. Buttery smooth transition glide
    if (isTransitioning.current && controlsRef.current) {
      const lerpSpeed = Math.min(delta * 3.5, 0.18);
      camera.position.lerp(targetCamPos.current, lerpSpeed);
      controlsRef.current.target.lerp(targetLookAt.current, lerpSpeed);
      controlsRef.current.update();

      const distPos = camera.position.distanceTo(targetCamPos.current);
      const distTarget = controlsRef.current.target.distanceTo(targetLookAt.current);

      if (distPos < 0.03 && distTarget < 0.03) {
        camera.position.copy(targetCamPos.current);
        controlsRef.current.target.copy(targetLookAt.current);
        controlsRef.current.update();
        isTransitioning.current = false;

        // Sync in-place yaw and anchor when transition arrives
        anchorPos.current.copy(camera.position);
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        targetYaw.current = Math.atan2(dir.x, -dir.z);
        currentYaw.current = targetYaw.current;
        targetPitch.current = Math.asin(THREE.MathUtils.clamp(dir.y, -0.99, 0.99));
        currentPitch.current = targetPitch.current;
        inPlaceYaw.current = targetYaw.current;
      }
      return;
    }

    // 3. Stationary In-Place 360 Look Around (Rotasi 360 di Satu Titik)
    if (isLookAround360) {
      currentYaw.current = THREE.MathUtils.damp(currentYaw.current, targetYaw.current, 15, delta);
      currentPitch.current = THREE.MathUtils.damp(currentPitch.current, targetPitch.current, 15, delta);

      const cosP = Math.cos(currentPitch.current);
      const forward = new THREE.Vector3(
        Math.sin(currentYaw.current) * cosP,
        Math.sin(currentPitch.current),
        -Math.cos(currentYaw.current) * cosP
      );

      camera.position.copy(anchorPos.current);
      const lookTarget = anchorPos.current.clone().addScaledVector(forward, 3.0);
      camera.lookAt(lookTarget);
      if (controlsRef.current) {
        controlsRef.current.target.copy(lookTarget);
      }
      return;
    }

    // 4. Smooth 360 Auto-Rotation (In-Place or Turntable)
    if (isAutoRotate && !isTransitioning.current && !isInteracting.current && controlsRef.current) {
      if (isInPlacePreset) {
        // Stationary In-Place 360 Rotation: camera position remains anchored, gaze sweeps 360 degrees smoothly
        inPlaceYaw.current += delta * 0.40 * autoRotateSpeed;
        const radius = 2.5;
        controlsRef.current.target.set(
          camera.position.x + Math.sin(inPlaceYaw.current) * radius,
          camera.position.y,
          camera.position.z - Math.cos(inPlaceYaw.current) * radius
        );
        camera.lookAt(controlsRef.current.target);
        controlsRef.current.update();
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={!isLookAround360}
      enableDamping
      dampingFactor={0.06}
      rotateSpeed={0.8}
      panSpeed={0.8}
      zoomSpeed={1.0}
      maxPolarAngle={Math.PI / 2 + 0.05} // Gentle floor constraint
      minDistance={0.1}
      maxDistance={250}
      autoRotate={isAutoRotate && !isInPlacePreset && !isTransitioning.current && !isInteracting.current}
      autoRotateSpeed={autoRotateSpeed * 1.5}
      onStart={() => {
        isTransitioning.current = false;
        isInteracting.current = true;
      }}
      onEnd={() => {
        isInteracting.current = false;
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        inPlaceYaw.current = Math.atan2(dir.x, -dir.z);
      }}
    />
  );
}
