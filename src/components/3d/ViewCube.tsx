'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Home, Compass } from 'lucide-react';
import { useConfiguratorStore } from '@/lib/configurator-store';

interface ViewCubeProps {
  onOrientCamera?: (pos: [number, number, number], target: [number, number, number]) => void;
}

export function ViewCube({ onOrientCamera }: ViewCubeProps) {
  const cubeRef = useRef<HTMLDivElement>(null);
  const compassRef = useRef<HTMLDivElement>(null);
  const [hoveredFace, setHoveredFace] = useState<string | null>(null);

  const houseSize = useConfiguratorStore((s) => s.houseSize);
  const houseCenter = useConfiguratorStore((s) => s.houseCenter);
  const setCameraPreset = useConfiguratorStore((s) => s.setCameraPreset);

  // Sync ViewCube rotation with 3D scene camera orientation
  useEffect(() => {
    let animId: number;

    const updateOrientation = () => {
      const camera = (window as any).__THREE_CAMERA__ as THREE.Camera | undefined;
      if (camera && cubeRef.current) {
        // Extract camera rotation matrix and invert it for the view cube
        const rotMat = new THREE.Matrix4().extractRotation(camera.matrixWorldInverse);
        const elements = rotMat.elements;

        // Apply CSS matrix3d to orient the cube relative to viewer
        // Three.js column-major to CSS transform
        const cssMatrix = [
          elements[0].toFixed(4), -elements[1].toFixed(4), elements[2].toFixed(4), 0,
          elements[4].toFixed(4), -elements[5].toFixed(4), elements[6].toFixed(4), 0,
          elements[8].toFixed(4), -elements[9].toFixed(4), elements[10].toFixed(4), 0,
          0, 0, 0, 1,
        ].join(',');

        cubeRef.current.style.transform = `matrix3d(${cssMatrix})`;

        // Rotate compass ring around Y axis
        if (compassRef.current) {
          const dir = new THREE.Vector3();
          camera.getWorldDirection(dir);
          const yaw = Math.atan2(dir.x, -dir.z) * (180 / Math.PI);
          compassRef.current.style.transform = `rotate(${yaw}deg)`;
        }
      }
      animId = requestAnimationFrame(updateOrientation);
    };

    animId = requestAnimationFrame(updateOrientation);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleFaceClick = useCallback(
    (faceId: string) => {
      const camera = (window as any).__THREE_CAMERA__ as THREE.Camera | undefined;
      const controls = (window as any).__THREE_CONTROLS__ as any;

      const target = controls?.target
        ? new THREE.Vector3().copy(controls.target)
        : new THREE.Vector3(houseCenter[0] || 0, (houseSize[1] || 3) * 0.45, houseCenter[2] || 0);

      const maxDim = Math.max(houseSize[0] || 5, houseSize[1] || 3, houseSize[2] || 8);
      const dist = maxDim * 1.6;

      const pos = new THREE.Vector3();

      switch (faceId) {
        case 'front':
          pos.set(target.x, target.y, target.z + dist);
          break;
        case 'back':
          pos.set(target.x, target.y, target.z - dist);
          break;
        case 'right':
          pos.set(target.x + dist, target.y, target.z);
          break;
        case 'left':
          pos.set(target.x - dist, target.y, target.z);
          break;
        case 'top':
          pos.set(target.x, target.y + dist * 1.2, target.z + 0.01);
          break;
        case 'bottom':
          pos.set(target.x, target.y - dist * 1.2, target.z + 0.01);
          break;
        case 'iso':
        default:
          pos.set(target.x + dist * 0.7, target.y + dist * 0.7, target.z + dist * 0.7);
          break;
      }

      if (onOrientCamera) {
        onOrientCamera([pos.x, pos.y, pos.z], [target.x, target.y, target.z]);
      } else {
        window.dispatchEvent(
          new CustomEvent('cad-orient-camera', {
            detail: { pos: [pos.x, pos.y, pos.z], target: [target.x, target.y, target.z] },
          })
        );
      }
    },
    [houseCenter, houseSize, onOrientCamera]
  );

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col items-center select-none pointer-events-auto">
      {/* Home / Reset view button */}
      <button
        type="button"
        onClick={() => handleFaceClick('iso')}
        title="Kembali ke Tampilan Isometrik Awal (Home)"
        className="mb-1.5 p-1.5 rounded-lg bg-white/90 hover:bg-white text-secondary hover:text-primary shadow-subtle border border-border/80 transition-all hover:scale-105"
      >
        <Home className="w-3.5 h-3.5" />
      </button>

      {/* 3D ViewCube Container */}
      <div className="relative w-24 h-24 flex items-center justify-center [perspective:500px]">
        {/* Compass Base Ring */}
        <div
          ref={compassRef}
          className="absolute inset-0 rounded-full border border-primary/20 pointer-events-none transition-transform duration-75"
        >
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[9px] font-bold text-red-500">U</span>
          <span className="absolute top-1/2 -right-1 -translate-y-1/2 text-[9px] font-bold text-secondary">T</span>
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold text-secondary">S</span>
          <span className="absolute top-1/2 -left-1 -translate-y-1/2 text-[9px] font-bold text-secondary">B</span>
        </div>

        {/* The 3D Cube */}
        <div
          ref={cubeRef}
          className="relative w-14 h-14 [transform-style:preserve-3d] transition-transform duration-75 ease-out cursor-pointer"
        >
          {/* DEPAN / FRONT */}
          <div
            onClick={() => handleFaceClick('front')}
            onMouseEnter={() => setHoveredFace('front')}
            onMouseLeave={() => setHoveredFace(null)}
            className={`absolute inset-0 flex items-center justify-center border text-[10px] font-bold tracking-wider transition-colors [transform:translateZ(28px)] ${
              hoveredFace === 'front'
                ? 'bg-amber-400 text-white border-amber-500 shadow-md'
                : 'bg-white/90 text-primary border-slate-300 hover:bg-slate-100'
            }`}
          >
            DEPAN
          </div>

          {/* BELAKANG / BACK */}
          <div
            onClick={() => handleFaceClick('back')}
            onMouseEnter={() => setHoveredFace('back')}
            onMouseLeave={() => setHoveredFace(null)}
            className={`absolute inset-0 flex items-center justify-center border text-[9px] font-bold tracking-wider transition-colors [transform:rotateY(180deg)_translateZ(28px)] ${
              hoveredFace === 'back'
                ? 'bg-amber-400 text-white border-amber-500 shadow-md'
                : 'bg-white/90 text-primary border-slate-300 hover:bg-slate-100'
            }`}
          >
            BELAKANG
          </div>

          {/* KANAN / RIGHT */}
          <div
            onClick={() => handleFaceClick('right')}
            onMouseEnter={() => setHoveredFace('right')}
            onMouseLeave={() => setHoveredFace(null)}
            className={`absolute inset-0 flex items-center justify-center border text-[10px] font-bold tracking-wider transition-colors [transform:rotateY(90deg)_translateZ(28px)] ${
              hoveredFace === 'right'
                ? 'bg-amber-400 text-white border-amber-500 shadow-md'
                : 'bg-white/90 text-primary border-slate-300 hover:bg-slate-100'
            }`}
          >
            KANAN
          </div>

          {/* KIRI / LEFT */}
          <div
            onClick={() => handleFaceClick('left')}
            onMouseEnter={() => setHoveredFace('left')}
            onMouseLeave={() => setHoveredFace(null)}
            className={`absolute inset-0 flex items-center justify-center border text-[10px] font-bold tracking-wider transition-colors [transform:rotateY(-90deg)_translateZ(28px)] ${
              hoveredFace === 'left'
                ? 'bg-amber-400 text-white border-amber-500 shadow-md'
                : 'bg-white/90 text-primary border-slate-300 hover:bg-slate-100'
            }`}
          >
            KIRI
          </div>

          {/* ATAS / TOP */}
          <div
            onClick={() => handleFaceClick('top')}
            onMouseEnter={() => setHoveredFace('top')}
            onMouseLeave={() => setHoveredFace(null)}
            className={`absolute inset-0 flex items-center justify-center border text-[10px] font-bold tracking-wider transition-colors [transform:rotateX(90deg)_translateZ(28px)] ${
              hoveredFace === 'top'
                ? 'bg-amber-400 text-white border-amber-500 shadow-md'
                : 'bg-white/90 text-primary border-slate-300 hover:bg-slate-100'
            }`}
          >
            ATAS
          </div>

          {/* BAWAH / BOTTOM */}
          <div
            onClick={() => handleFaceClick('bottom')}
            onMouseEnter={() => setHoveredFace('bottom')}
            onMouseLeave={() => setHoveredFace(null)}
            className={`absolute inset-0 flex items-center justify-center border text-[9px] font-bold tracking-wider transition-colors [transform:rotateX(-90deg)_translateZ(28px)] ${
              hoveredFace === 'bottom'
                ? 'bg-amber-400 text-white border-amber-500 shadow-md'
                : 'bg-white/90 text-primary border-slate-300 hover:bg-slate-100'
            }`}
          >
            BAWAH
          </div>
        </div>
      </div>
      <span className="text-[9px] text-secondary/80 font-medium tracking-tight mt-0.5">AutoCAD 3D</span>
    </div>
  );
}
