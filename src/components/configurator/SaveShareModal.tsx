'use client';

import React, { useState } from 'react';
import { Project } from '@/types';
import { useConfiguratorStore } from '@/lib/configurator-store';
import { getMaterialById } from '@/lib/materials';
import confetti from 'canvas-confetti';
import {
  X,
  Copy,
  Check,
  Download,
  Share2,
  BookmarkCheck,
  ExternalLink,
} from 'lucide-react';

interface SaveShareModalProps {
  project: Project;
}

export function SaveShareModal({ project }: SaveShareModalProps) {
  const isSaveModalOpen = useConfiguratorStore((s) => s.isSaveModalOpen);
  const setSaveModalOpen = useConfiguratorStore((s) => s.setSaveModalOpen);
  const isShareModalOpen = useConfiguratorStore((s) => s.isShareModalOpen);
  const setShareModalOpen = useConfiguratorStore((s) => s.setShareModalOpen);

  const selectedMaterials = useConfiguratorStore((s) => s.selectedMaterials);
  const customColors = useConfiguratorStore((s) => s.customColors);
  const zoneTextureSettings = useConfiguratorStore((s) => s.zoneTextureSettings);

  const [copied, setCopied] = useState(false);
  const [configTitle, setConfigTitle] = useState('My Custom Architecture');

  if (!isSaveModalOpen && !isShareModalOpen) return null;

  // Prepare full configuration payload
  const configPayload = {
    projectId: project.id,
    projectName: project.name,
    title: configTitle,
    createdAt: new Date().toISOString(),
    configuration: selectedMaterials,
    customColors: customColors,
    textureSettings: zoneTextureSettings,
  };

  // Encode configuration into a URL-safe parameter
  const encodedConfig = typeof window !== 'undefined'
    ? btoa(JSON.stringify({ m: selectedMaterials, c: customColors, t: zoneTextureSettings }))
    : '';

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/configurator/${project.id}?config=${encodeURIComponent(encodedConfig)}`
    : '';

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSaveDesign = () => {
    // Save to localStorage
    try {
      const existingKey = `homecraft_saved_configs_${project.id}`;
      const savedList = JSON.parse(localStorage.getItem(existingKey) || '[]');
      savedList.unshift(configPayload);
      localStorage.setItem(existingKey, JSON.stringify(savedList));
    } catch (e) {
      console.error(e);
    }

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#171717', '#C28448', '#8C6D46', '#3B82F6'],
      });
    } catch (_) {}

    setSaveModalOpen(false);
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(configPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${project.id}-configuration.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl border border-border shadow-panel overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center text-primary">
              {isSaveModalOpen ? (
                <BookmarkCheck className="w-4 h-4" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-primary">
                {isSaveModalOpen ? 'Save Architectural Configuration' : 'Share 3D Customization'}
              </h2>
              <p className="text-xs text-secondary">{project.name}</p>
            </div>
          </div>

          <button
            onClick={() => {
              setSaveModalOpen(false);
              setShareModalOpen(false);
            }}
            className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {isSaveModalOpen ? (
            <>
              <div>
                <label className="text-xs font-medium text-primary block mb-1.5">
                  Design Title / Client Revision
                </label>
                <input
                  type="text"
                  value={configTitle}
                  onChange={(e) => setConfigTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-border focus:outline-none focus:border-primary text-primary"
                  placeholder="e.g. Scandi Light Oak & Travertine Spec"
                />
              </div>

              {/* Material Breakdown Summary */}
              <div>
                <span className="text-xs font-semibold text-secondary uppercase tracking-wider block mb-2">
                  Configured Surfaces ({project.zones.length})
                </span>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                  {project.zones.map((zone) => {
                    const matId = selectedMaterials[zone.id] || zone.defaultMaterialId;
                    const mat = getMaterialById(matId);
                    const customCol = customColors[zone.id];

                    return (
                      <div
                        key={zone.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-surface-50 border border-border/60"
                      >
                        <span className="font-medium text-primary">{zone.name}</span>
                        <span className="text-secondary font-mono text-[11px]">
                          {customCol ? `Custom (${customCol})` : (mat?.name || 'Default')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-secondary leading-relaxed">
                Anyone with this link can open this 3D house model with your customized wall colors, floor materials, and ceramic tiles applied in real time.
              </p>

              <div>
                <label className="text-xs font-medium text-primary block mb-1.5">
                  Shareable Configurator URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 px-3.5 py-2 text-xs font-mono text-secondary rounded-xl border border-border bg-surface-50 focus:outline-none select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded-xl transition-all shadow-subtle shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 bg-surface-50 border-t border-border flex items-center justify-between">
          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 text-xs font-medium text-secondary hover:text-primary transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Spec (JSON)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSaveModalOpen(false);
                setShareModalOpen(false);
              }}
              className="px-4 py-2 text-xs font-medium text-secondary hover:text-primary transition-colors"
            >
              Close
            </button>
            {isSaveModalOpen && (
              <button
                onClick={handleSaveDesign}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded-xl transition-all shadow-subtle"
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>Confirm Save</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
