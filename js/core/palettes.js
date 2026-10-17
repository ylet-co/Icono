/**
 * Palettes.
 *
 * A palette is the recolor layer: the same generated icon rendered in a named
 * ink + accent + surface combination. 10 palettes x 108,800 generated icons is
 * where the "1M+ icons" figure comes from — no palette changes the geometry, so
 * the whole stash stays coherent.
 */

export const PALETTES = [
  { id: 'obsidian', name: 'Obsidian', ink: '#F4F4F6', accent: '#FF5C1A', surface: '#0B0C0F', note: 'Default dark workspace' },
  { id: 'graphite', name: 'Graphite', ink: '#1B1D22', accent: '#FF5C1A', surface: '#F6F6F7', note: 'Light workspace, same signal accent' },
  { id: 'ink', name: 'Ink', ink: '#0A0A0B', accent: '#0A0A0B', surface: '#FFFFFF', note: 'Pure monochrome for print' },
  { id: 'signal', name: 'Signal', ink: '#E8FFF4', accent: '#00E58A', surface: '#04140E', note: 'Terminal green' },
  { id: 'cobalt', name: 'Cobalt', ink: '#E7F0FF', accent: '#3B82F6', surface: '#050B1A', note: 'Cool product blue' },
  { id: 'magenta', name: 'Magenta', ink: '#FFEAF7', accent: '#FF2FA0', surface: '#170410', note: 'High-energy marketing' },
  { id: 'amber', name: 'Amber', ink: '#FFF6E5', accent: '#F5A524', surface: '#160F03', note: 'Warm, tactile' },
  { id: 'violet', name: 'Violet', ink: '#F1EBFF', accent: '#8B5CF6', surface: '#0C0618', note: 'Soft tech' },
  { id: 'cyan', name: 'Cyan', ink: '#E3FCFF', accent: '#22D3EE', surface: '#03141A', note: 'Data and dashboards' },
  { id: 'crimson', name: 'Crimson', ink: '#FFECEE', accent: '#EF4444', surface: '#180406', note: 'Alerts and destructive' },
];

export const PALETTE_IDS = PALETTES.map((p) => p.id);

export function getPalette(id) {
  if (!id) return null;
  return PALETTES.find((p) => p.id === String(id).toLowerCase()) || null;
}
