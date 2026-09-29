'use client';

import React from 'react';
import { MaterialCategory } from '@/types';
import { MATERIAL_CATEGORIES } from '@/lib/materials';
import { useConfiguratorStore } from '@/lib/configurator-store';
import {
  Paintbrush,
  LayoutGrid,
  Sparkles,
  Home,
  DoorOpen,
  Building,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Paintbrush,
  LayoutGrid,
  Sparkles,
  Home,
  DoorOpen,
  Building,
};

interface CategorySelectorProps {
  availableCategories?: MaterialCategory[];
}

export function CategorySelector({ availableCategories }: CategorySelectorProps) {
  const activeCategory = useConfiguratorStore((s) => s.activeCategory);
  const setActiveCategory = useConfiguratorStore((s) => s.setActiveCategory);

  const categories = availableCategories
    ? MATERIAL_CATEGORIES.filter((c) => availableCategories.includes(c.id))
    : MATERIAL_CATEGORIES;

  return (
    <div className="w-full border-b border-border bg-white px-3 pt-3">
      <div className="flex items-center gap-1 overflow-x-auto pb-3 scrollbar-none">
        {categories.map((cat) => {
          const Icon = (ICON_MAP[cat.icon] || Paintbrush) as React.ComponentType<{ className?: string }>;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-subtle'
                  : 'text-secondary hover:text-primary hover:bg-surface-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
