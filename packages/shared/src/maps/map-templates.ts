export const MAP_TEMPLATE_IDS = ["classic-office", "coworking-campus"] as const;

export type MapTemplateId = (typeof MAP_TEMPLATE_IDS)[number];

export type MapTemplateDefinition = {
  id: MapTemplateId;
  name: string;
  description: string;
  dimensions: { width: number; height: number };
  spawn: { x: number; y: number };
  thumbnail: string;
};

export const DEFAULT_MAP_TEMPLATE: MapTemplateId = "classic-office";

export const MAP_TEMPLATES: Record<MapTemplateId, MapTemplateDefinition> = {
  "classic-office": {
    id: "classic-office",
    name: "Classic Office",
    description: "Private offices, meeting rooms, a lounge, café, and game corner.",
    dimensions: { width: 44, height: 34 },
    spawn: { x: 19, y: 27 },
    thumbnail: "/assets/maps/classic-office.png",
  },
  "coworking-campus": {
    id: "coworking-campus",
    name: "Coworking Campus",
    description: "Team desk pods, colorful lounges, meeting rooms, café, and pond courtyard.",
    dimensions: { width: 52, height: 38 },
    spawn: { x: 25, y: 33 },
    thumbnail: "/assets/maps/coworking-campus.png",
  },
};

export function isMapTemplateId(value: unknown): value is MapTemplateId {
  return typeof value === "string" && MAP_TEMPLATE_IDS.includes(value as MapTemplateId);
}

export function getMapTemplate(value: unknown): MapTemplateDefinition {
  return MAP_TEMPLATES[isMapTemplateId(value) ? value : DEFAULT_MAP_TEMPLATE];
}
