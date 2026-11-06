import catalog from '../data/objectives.json';
import weaponPadCatalog from '../data/weapon-pads.json';
import backgroundCatalog from '../data/backgrounds.json';
import filmLayouts from '../data/film-layouts.json';

interface CatalogShape {
  family: string;
  halfX?: number;
  halfY?: number;
  fwdX?: number;
  fwdY?: number;
  radius?: number;
}

interface CatalogObjective {
  role: string;
  team: number;
  x: number;
  y: number;
  z: number;
  shape?: CatalogShape;
}

interface CatalogEntry {
  name: string;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  /** Present only for maps whose position layout detection cannot recover. */
  quant?: { axisWidths: number[]; regionIndexBits: number };
  objectives: CatalogObjective[];
}

/** The film position layout of a map that needs one supplied, if any. */
export function filmLayoutFor(
  mapId: string,
): { gateBits: number; axisBits: [number, number, number] } | undefined {
  const quant = maps[MAP_ALIASES[mapId] ?? mapId]?.quant;
  if (!quant) return undefined;
  const [x, y, z] = quant.axisWidths;
  // Four fixed gate bits precede the region index.
  return { gateBits: 4 + quant.regionIndexBits, axisBits: [x, y, z] };
}

export function filmWorldBoundsFor(
  mapId: string,
):
  | { min: [number, number, number]; max: [number, number, number] }
  | undefined {
  const entry = maps[MAP_ALIASES[mapId] ?? mapId];
  if (!entry) return undefined;
  const layouts: Record<string, { zBounds?: number[] }> = filmLayouts.layouts;
  const zBounds =
    layouts[entry.name.toLowerCase().replace(/ - ranked$/, '')]?.zBounds;
  if (!zBounds || zBounds.length !== 2) return undefined;
  return {
    min: [entry.bounds.minX, entry.bounds.minY, zBounds[0]],
    max: [entry.bounds.maxX, entry.bounds.maxY, zBounds[1]],
  };
}

/** An objective placed in the same normalized space as film positions. */
export interface MapObjective {
  role: string;
  /** A spot to touch (flag spawn, socket) rather than an area to hold. */
  point: boolean;
  /** Owning team index from the map file; -1 when neutral. */
  team: number;
  x: number;
  y: number;
  /** Footprint corners of a box zone. */
  polygon?: [number, number][];
  /** Radius of a cylinder zone, in normalized x units. */
  radius?: number;
}

// Static objective placements were extracted from the game's map variants
// (via LevelUp's map_objectives catalog) in world units. Film positions are
// normalized to the map's quantization bounds, so they are converted here.
/** Values of the Halo Infinite API's GameVariantCategory that have map objectives. */
export const GameVariantCategory = {
  MultiplayerStrongholds: 11,
  MultiplayerKingOfTheHill: 12,
  MultiplayerCtf: 15,
  MultiplayerExtraction: 17,
  MultiplayerOddball: 18,
  MultiplayerStockpile: 19,
} as const;

const maps: Record<string, CatalogEntry> = catalog;

// Map variants that reuse another variant's layout but carry their own asset id.
const MAP_ALIASES: Record<string, string> = {
  // Argyle (ranked variant)
  '78677080-db7a-429e-84fe-f041d8342c37':
    'dd600260-d91c-4d77-9990-3f35873c90a1',
  // Empyrean (ranked variant)
  '70dd38c5-2eb7-4db3-8901-0dfca292ff18':
    'd035fc3e-f298-4c14-9487-465be2e1dc1f',
  // Bazaar API asset ID
  '298d5036-cd43-47b3-a4bd-31e127566593':
    '3e1e4cec-4f2c-44c6-b8d2-96b85c66c702',
};

const ROLES_BY_CATEGORY: Partial<Record<number, string[]>> = {
  [GameVariantCategory.MultiplayerCtf]: ['flag_spawn', 'flag_delivery'],
  [GameVariantCategory.MultiplayerOddball]: ['oddball_spawn'],
  [GameVariantCategory.MultiplayerStrongholds]: ['strongholds_zone'],
  [GameVariantCategory.MultiplayerKingOfTheHill]: ['hill'],
  [GameVariantCategory.MultiplayerExtraction]: ['extraction_zone'],
  [GameVariantCategory.MultiplayerStockpile]: ['stockpile_socket'],
};

/** Roles whose objects are points to touch rather than areas to hold. */
const POINT_ROLES = new Set([
  'flag_spawn',
  'flag_delivery',
  'oddball_spawn',
  'stockpile_socket',
]);

function isPointRole(role: string) {
  return POINT_ROLES.has(role);
}

/** Normalized film units per world meter along x, or undefined for an uncatalogued map. */
export function normalizedPerMeter(mapId: string): number | undefined {
  const entry = maps[MAP_ALIASES[mapId] ?? mapId];
  return entry && 1 / (entry.bounds.maxX - entry.bounds.minX);
}

export interface MapBackground {
  /** File name of the pre-rendered top-down image; the consumer decides where it is served from. */
  image: string;
  /** The image's extent in the same normalized space as film positions (y grows up). */
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface BackgroundCalibration {
  image: string;
  metersPerPixel: number;
  originX: number;
  originY: number;
  widthPx: number;
  heightPx: number;
  /** The map's quantization bounds, which film positions are normalized to. */
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}

const backgroundEntries: Record<string, BackgroundCalibration> =
  backgroundCatalog.entries;
const backgroundIndex: Record<string, string> = backgroundCatalog.index;

function backgroundCalibration(mapName: string) {
  const name = mapName.toLowerCase();
  const key =
    backgroundIndex[name] ?? backgroundIndex[name.replace(/ - ranked$/, '')];
  return key ? backgroundEntries[key] : undefined;
}

/** The pre-rendered top-down image of a map, placed in normalized film space. */
export function mapBackgroundFor(mapName: string): MapBackground | undefined {
  const cal = backgroundCalibration(mapName);
  if (!cal) return undefined;
  const { minX, maxX, minY, maxY } = cal.bounds;
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const width = cal.widthPx * cal.metersPerPixel;
  const height = cal.heightPx * cal.metersPerPixel;
  return {
    image: cal.image,
    minX: (cal.originX - minX) / spanX,
    maxX: (cal.originX + width - minX) / spanX,
    minY: (cal.originY - height - minY) / spanY,
    maxY: (cal.originY - minY) / spanY,
  };
}

export function mapObjectivesFor(
  mapId: string,
  category: number,
): MapObjective[] {
  const roles = ROLES_BY_CATEGORY[category];
  const entry = maps[MAP_ALIASES[mapId] ?? mapId];
  if (!roles || !entry) return [];
  const { minX, maxX, minY, maxY } = entry.bounds;
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const nx = (x: number) => (x - minX) / spanX;
  const ny = (y: number) => (y - minY) / spanY;
  return entry.objectives
    .filter((o) => roles.includes(o.role))
    .map((o): MapObjective => {
      const point = isPointRole(o.role);
      const base = {
        role: o.role,
        point,
        team: o.team,
        x: nx(o.x),
        y: ny(o.y),
      };
      const { shape } = o;
      if (point || !shape) return base;
      if (shape.family === 'box') {
        const hx = shape.halfX ?? 0;
        const hy = shape.halfY ?? 0;
        const len = Math.hypot(shape.fwdX ?? 1, shape.fwdY ?? 0) || 1;
        const fx = (shape.fwdX ?? 1) / len;
        const fy = (shape.fwdY ?? 0) / len;
        const corners: [number, number][] = [
          [hx, hy],
          [hx, -hy],
          [-hx, -hy],
          [-hx, hy],
        ];
        const polygon = corners.map(([a, b]): [number, number] => [
          nx(o.x + a * fx - b * fy),
          ny(o.y + a * fy + b * fx),
        ]);
        return { ...base, polygon };
      }
      return { ...base, radius: (shape.radius ?? 2) / spanX };
    });
}

/**
 * A weapon pad placement in the same normalized space as film positions.
 * The map file lists every pad it declares; it does not say which are active
 * in a given game mode, so some pads may be unused in a match.
 */
export interface WeaponPad {
  /** Inferred class of weapon: power weapons, ordinary racks, or power-ups. */
  family: 'power' | 'rack' | 'powerup';
  /** Raw object type id from the map file. */
  typeId: string;
  x: number;
  y: number;
}

interface WeaponPadEntry {
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  pads: { family: string; typeId: string; x: number; y: number }[];
}

const weaponPadEntries: Record<string, WeaponPadEntry> = weaponPadCatalog;

/** Weapon pads of a map, or an empty list for an uncatalogued map. */
export function weaponPadsFor(mapId: string): WeaponPad[] {
  const entry = weaponPadEntries[MAP_ALIASES[mapId] ?? mapId];
  if (!entry) return [];
  const { minX, maxX, minY, maxY } = entry.bounds;
  return entry.pads.flatMap((p) =>
    p.family === 'power' || p.family === 'rack' || p.family === 'powerup'
      ? [
          {
            family: p.family,
            typeId: p.typeId,
            x: (p.x - minX) / (maxX - minX),
            y: (p.y - minY) / (maxY - minY),
          },
        ]
      : [],
  );
}
