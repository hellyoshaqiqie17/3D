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
  const houseCenter = useConfiguratorStore((s) => s.houseCenter);
  const setRoofHidden = useConfiguratorStore((s) => s.setRoofHidden);
  const setCeilingCut = useConfiguratorStore((s) => s.setCeilingCut);
  const setEnvironmentHidden = useConfiguratorStore((s) => s.setEnvironmentHidden);
  const setCameraMode = useConfiguratorStore((s) => s.setCameraMode);
  const isAutoRotate = useConfiguratorStore((s) => s.isAutoRotate);
  const autoRotateSpeed = useConfiguratorStore((s) => s.autoRotateSpeed);
  const isLookAround360 = useConfiguratorStore((s) => s.isLookAround360);
  const isWalkMode = useConfiguratorStore((s) => s.isWalkMode);
  const walkSpeed = useConfiguratorStore((s) => s.walkSpeed);

  const targetCamPos = useRef(new THREE.Vector3(12, 8, 14));
  const targetLookAt = useRef(new THREE.Vector3(0, 1.5, 0));
  const isTransitioning = useRef(false);
  const inPlaceYaw = useRef(0);
  const isInteracting = useRef(false);

  // In-place 360 Look Around & Walk mode refs
  const anchorPos = useRef(new THREE.Vector3());
  const currentYaw = useRef(0);
  const currentPitch = useRef(0);
  const targetYaw = useRef(0);
  const targetPitch = useRef(0);
  const isDraggingPointer = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  // Key states for Blender-style WASD walk mode
  const activeKeys = useRef<{ [key: string]: boolean }>({});

  const isInPlacePreset =
    activeCameraPreset === 'interior' ||
    activeCameraPreset === 'living' ||
    activeCameraPreset === 'bedroom';

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
  }, [activeCameraPreset, isLookAround360, isWalkMode, camera]);

  // Pointer drag listeners for manual 360 rotation & Walk look
  useEffect(() => {
    const glDom = gl.domElement;
    if (!glDom) return;

    const isActiveLook = isLookAround360 || isWalkMode;

    if (isActiveLook) {
      isTransitioning.current = false;
      anchorPos.current.copy(camera.position);
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      targetYaw.current = Math.atan2(dir.x, -dir.z);
      currentYaw.current = targetYaw.current;
      targetPitch.current = Math.asin(THREE.MathUtils.clamp(dir.y, -0.99, 0.99));
      currentPitch.current = targetPitch.current;
      glDom.style.cursor = isWalkMode ? 'crosshair' : 'grab';
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
      if (!isActiveLook || (e.button !== 0 && e.button !== 2)) return;
      isDraggingPointer.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      glDom.style.cursor = isWalkMode ? 'crosshair' : 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isActiveLook || !isDraggingPointer.current) return;
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };

      const sensitivity = isWalkMode ? 0.003 : 0.0035;
      targetYaw.current -= dx * sensitivity;
      targetPitch.current += dy * sensitivity;
      targetPitch.current = Math.max(-1.48, Math.min(1.48, targetPitch.current));
    };

    const onPointerUp = () => {
      if (!isActiveLook) return;
      isDraggingPointer.current = false;
      glDom.style.cursor = isWalkMode ? 'crosshair' : 'grab';
    };

    // Continuous Dolly / Zoom-Through when scrolling mouse wheel in Orbit mode
    const onWheel = (e: WheelEvent) => {
      if (isActiveLook) {
        // In walk mode, scroll wheel adjusts eye FOV slightly or forward movement
        return;
      }

      if (!controlsRef.current) return;

      const controls = controlsRef.current;
      const dist = camera.position.distanceTo(controls.target);

      // If user scrolls forward and is close to target or entering room:
      // Continuously push target forward along look vector so camera never freezes at wall!
      if (e.deltaY < 0 && dist < 1.4) {
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        const pushStep = 0.5;
        camera.position.addScaledVector(forward, pushStep);
        controls.target.addScaledVector(forward, pushStep);
        controls.update();
      }
    };

    glDom.addEventListener('pointerdown', onPointerDown);
    glDom.addEventListener('wheel', onWheel, { passive: true });
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
  }, [isLookAround360, isWalkMode, gl, camera]);

  // Expose Three instances for ViewCube and report generator
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__THREE_SCENE__ = scene;
      (window as any).__THREE_CAMERA__ = camera;
      (window as any).__THREE_CONTROLS__ = controlsRef.current;
      (window as any).__THREE_GL__ = gl;
      (window as any).__THREE_RENDER_FRAME__ = () => {
        gl.render(scene, camera);
      };
    }
  }, [scene, camera, gl]);

  // Listen to AutoCAD ViewCube and automated report orientation events
  useEffect(() => {
    const handleCadOrient = (e: Event) => {
      const customEvent = e as CustomEvent<{
        pos: [number, number, number];
        target: [number, number, number];
        instant?: boolean;
        fov?: number;
      }>;
      if (!customEvent.detail) return;
      const { pos, target, instant, fov } = customEvent.detail;

      if (fov && camera instanceof THREE.PerspectiveCamera) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }

      if (instant) {
        camera.position.set(pos[0], pos[1], pos[2]);
        if (controlsRef.current) {
          controlsRef.current.target.set(target[0], target[1], target[2]);
          controlsRef.current.update();
        }
        camera.lookAt(target[0], target[1], target[2]);
        targetCamPos.current.set(pos[0], pos[1], pos[2]);
        targetLookAt.current.set(target[0], target[1], target[2]);
        isTransitioning.current = false;
        gl.render(scene, camera);
      } else {
        targetCamPos.current.set(pos[0], pos[1], pos[2]);
        targetLookAt.current.set(target[0], target[1], target[2]);
        isTransitioning.current = true;
      }
    };

    window.addEventListener('cad-orient-camera', handleCadOrient);
    return () => window.removeEventListener('cad-orient-camera', handleCadOrient);
  }, [camera, gl, scene]);

  // Dynamic calculation of camera viewpoints based on actual loaded model bounds
  const calculatePresetVectors = useCallback(
    (presetId: string) => {
      // Dynamic room bounds (centered at origin by HouseModel)
      const w = Math.max(houseSize[0] || 4.7, 3.0);
      const h = Math.max(houseSize[1] || 3.2, 2.5);
      const d = Math.max(houseSize[2] || 8.0, 3.0);

      const cX = houseCenter[0] || 0;
      const cY = 0; // Ground floor level inside room
      const cZ = houseCenter[2] || 0;

      // Comfortable human eye level inside the room
      const eyeLevel = Math.min(cY + 1.50, h * 0.55);

      switch (presetId) {
        case 'exterior':
          setCameraFov(52);
          setCameraMode('orbit');
          return {
            pos: new THREE.Vector3(cX + w * 1.1 + 2.5, h * 1.2 + 2.5, cZ + d * 1.0 + 2.5),
            target: new THREE.Vector3(cX, h * 0.45, cZ),
          };

        case 'interior':
        case 'living':
          // RUANG TAMU: Placed INSIDE the room at human eye-level looking across the lounge/furniture
          setRoofHidden(false);
          setCameraFov(70); // Natural wide-angle interior lens
          setCameraMode('interior');
          return {
            pos: new THREE.Vector3(cX, eyeLevel, cZ + d * 0.22),
            target: new THREE.Vector3(cX, eyeLevel - 0.05, cZ - d * 0.18),
          };

        case 'bedroom':
          setRoofHidden(false);
          setCameraFov(68);
          setCameraMode('interior');
          return {
            pos: new THREE.Vector3(cX - w * 0.25, eyeLevel, cZ - d * 0.1),
            target: new THREE.Vector3(cX + w * 0.15, eyeLevel - 0.05, cZ + d * 0.15),
          };

        case 'dollhouse':
          // PERSPEKTIF ATAS (Buka Atap / Dollhouse): 45-degree angled view with ceiling sliced
          setRoofHidden(true);
          setCeilingCut(true);
          setCameraFov(55);
          setCameraMode('orbit');
          return {
            pos: new THREE.Vector3(cX, h * 2.2 + 2.0, cZ + d * 0.85),
            target: new THREE.Vector3(cX, cY, cZ),
          };

        case 'facade':
          // FASAD DEPAN: Street eye-level facing entrance
          setCameraFov(52);
          setCameraMode('orbit');
          return {
            pos: new THREE.Vector3(cX, eyeLevel + 0.5, cZ + d * 0.85 + 2.5),
            target: new THREE.Vector3(cX, eyeLevel, cZ),
          };

        case 'top':
          // DENAH ATAS: 90-degree straight top-down view
          setRoofHidden(true);
          setCeilingCut(true);
          setEnvironmentHidden(true);
          setCameraFov(48);
          setCameraMode('orbit');
          return {
            pos: new THREE.Vector3(cX, Math.max(w, d) * 1.6 + 3.0, cZ + 0.01),
            target: new THREE.Vector3(cX, cY, cZ),
          };

        default:
          return {
            pos: new THREE.Vector3(cX + w * 1.1 + 2.5, h * 1.2 + 2.5, cZ + d * 1.0 + 2.5),
            target: new THREE.Vector3(cX, h * 0.45, cZ),
          };
      }
    },
    [houseSize, houseCenter, setRoofHidden, setCeilingCut, setEnvironmentHidden, setCameraFov, setCameraMode]
  );

  useEffect(() => {
    const { pos, target } = calculatePresetVectors(activeCameraPreset);
    targetCamPos.current.copy(pos);
    targetLookAt.current.copy(target);
    isTransitioning.current = true;
  }, [activeCameraPreset, cameraPresetVersion, calculatePresetVectors]);

  // Double-Click to Teleport / Enter Room smoothly at any 3D point
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
          // Teleport inside onto clicked floor point at comfortable eye level (1.50m)
          targetCamPos.current.set(point.x, 1.50, point.z);
          targetLookAt.current.set(point.x + dir.x * 2.5, 1.45, point.z + dir.z * 2.5);
          setCameraFov(70);
        } else {
          // Focus in front of clicked wall / furniture from 1.5m away
          targetLookAt.current.copy(point);
          const camOffset = new THREE.Vector3();
          camera.getWorldDirection(camOffset);
          targetCamPos.current.copy(point).addScaledVector(camOffset, -1.8);
          if (targetCamPos.current.y < 0.4) targetCamPos.current.y = 0.4;
        }
        isTransitioning.current = true;
      }
    };

    glDom.addEventListener('dblclick', handleDblClick);
    return () => glDom.removeEventListener('dblclick', handleDblClick);
  }, [camera, scene, gl, setCameraFov]);

  // Blender-Style Keyboard Walk Navigation (WASD / Arrow Keys + Q/E Elevation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }
      activeKeys.current[e.key.toLowerCase()] = true;
      activeKeys.current[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      activeKeys.current[e.key.toLowerCase()] = false;
      activeKeys.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

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
      const lerpSpeed = Math.min(delta * 4.0, 0.22);
      camera.position.lerp(targetCamPos.current, lerpSpeed);
      controlsRef.current.target.lerp(targetLookAt.current, lerpSpeed);
      controlsRef.current.update();

      const distPos = camera.position.distanceTo(targetCamPos.current);
      const distTarget = controlsRef.current.target.distanceTo(targetLookAt.current);

      if (distPos < 0.04 && distTarget < 0.04) {
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

    // 3. Blender-Style Walk Navigation (WASD + Mouse Look)
    if (isWalkMode) {
      // Mouse Look smoothing
      currentYaw.current = THREE.MathUtils.damp(currentYaw.current, targetYaw.current, 18, delta);
      currentPitch.current = THREE.MathUtils.damp(currentPitch.current, targetPitch.current, 18, delta);

      const cosP = Math.cos(currentPitch.current);
      const forwardDir = new THREE.Vector3(
        Math.sin(currentYaw.current) * cosP,
        Math.sin(currentPitch.current),
        -Math.cos(currentYaw.current) * cosP
      ).normalize();

      // Horizontal movement plane
      const moveForward = new THREE.Vector3(Math.sin(currentYaw.current), 0, -Math.cos(currentYaw.current)).normalize();
      const moveRight = new THREE.Vector3(Math.cos(currentYaw.current), 0, Math.sin(currentYaw.current)).normalize();

      const isSprint = activeKeys.current['shift'] || activeKeys.current['shiftleft'] || activeKeys.current['shiftright'];
      const speed = (isSprint ? 5.5 : 2.5) * walkSpeed * delta;

      const moveVec = new THREE.Vector3();
      if (activeKeys.current['w'] || activeKeys.current['arrowup']) moveVec.add(moveForward);
      if (activeKeys.current['s'] || activeKeys.current['arrowdown']) moveVec.sub(moveForward);
      if (activeKeys.current['a'] || activeKeys.current['arrowleft']) moveVec.sub(moveRight);
      if (activeKeys.current['d'] || activeKeys.current['arrowright']) moveVec.add(moveRight);
      if (activeKeys.current['e']) moveVec.y += 0.8;
      if (activeKeys.current['q']) moveVec.y -= 0.8;

      if (moveVec.lengthSq() > 0) {
        moveVec.normalize().multiplyScalar(speed);
        camera.position.add(moveVec);
        if (camera.position.y < 0.3) camera.position.y = 0.3; // Prevent falling below floor
        anchorPos.current.copy(camera.position);
      }

      // Orient camera to view direction
      const lookTarget = camera.position.clone().addScaledVector(forwardDir, 3.0);
      camera.lookAt(lookTarget);
      if (controlsRef.current) {
        controlsRef.current.target.copy(lookTarget);
      }
      return;
    }

    // 4. Stationary In-Place 360 Look Around
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

    // 5. Smooth 360 Auto-Rotation
    if (isAutoRotate && !isTransitioning.current && !isInteracting.current && controlsRef.current) {
      if (isInPlacePreset) {
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
      enabled={!isLookAround360 && !isWalkMode}
      enableDamping
      dampingFactor={0.06}
      rotateSpeed={0.8}
      panSpeed={0.8}
      zoomSpeed={1.2}
      maxPolarAngle={Math.PI / 2 + 0.05} // Gentle floor constraint
      minDistance={0.05}
      maxDistance={350}
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
