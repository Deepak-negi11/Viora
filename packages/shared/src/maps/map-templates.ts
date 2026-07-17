export const MAP_TEMPLATE_IDS = ["classic-office", "coworking-campus"] as const;

export type MapTemplateId = (typeof MAP_TEMPLATE_IDS)[number];

export type ChatRoomZone = {
  id: string;
  name: string;
  bounds: { x: number; y: number; width: number; height: number };
};

export type MapTemplateDefinition = {
  id: MapTemplateId;
  name: string;
  description: string;
  dimensions: { width: number; height: number };
  spawn: { x: number; y: number };
  thumbnail: string;
  chatRooms: ChatRoomZone[];
};

export const DEFAULT_MAP_TEMPLATE: MapTemplateId = "classic-office";

export const MAP_TEMPLATES: Record<MapTemplateId, MapTemplateDefinition> = {
  "classic-office": {
    id: "classic-office",
    name: "Classic Office",
    description: "Private offices, meeting rooms, a lounge, café, and game corner.",
    dimensions: { width: 44, height: 34 },
    spawn: { x: 19, y: 27 },
    thumbnail: "/assets/maps/classic-office-v2.png",
    chatRooms: [
      { id: "atlas-room", name: "Atlas Room", bounds: { x: 4, y: 3, width: 6, height: 6 } },
      { id: "cedar-room", name: "Cedar Room", bounds: { x: 4, y: 10, width: 6, height: 6 } },
      { id: "harbor-room", name: "Harbor Room", bounds: { x: 4, y: 17, width: 6, height: 6 } },
      { id: "orbit-room", name: "Orbit Room", bounds: { x: 34, y: 3, width: 6, height: 6 } },
      { id: "nova-room", name: "Nova Room", bounds: { x: 34, y: 10, width: 6, height: 6 } },
      { id: "willow-room", name: "Willow Room", bounds: { x: 34, y: 17, width: 6, height: 6 } },
      { id: "canvas-studio", name: "Canvas Studio", bounds: { x: 12, y: 3, width: 7, height: 6 } },
      { id: "pixel-lab", name: "Pixel Lab", bounds: { x: 24, y: 3, width: 7, height: 6 } },
      { id: "coffee-nook", name: "Coffee Nook", bounds: { x: 20, y: 3, width: 3, height: 6 } },
      { id: "summit-room", name: "Summit Room", bounds: { x: 13, y: 12, width: 7, height: 7 } },
      { id: "commons", name: "The Commons", bounds: { x: 22, y: 11, width: 10, height: 8 } },
      { id: "workshop", name: "The Workshop", bounds: { x: 12, y: 21, width: 10, height: 6 } },
      { id: "hearth-kitchen", name: "Hearth Kitchen", bounds: { x: 4, y: 24, width: 6, height: 5 } },
      { id: "arcade", name: "The Arcade", bounds: { x: 34, y: 24, width: 6, height: 5 } },
    ],
  },
  "coworking-campus": {
    id: "coworking-campus",
    name: "Coworking Campus",
    description: "Team desk pods, colorful lounges, meeting rooms, café, and pond courtyard.",
    dimensions: { width: 52, height: 38 },
    spawn: { x: 25, y: 33 },
    thumbnail: "/assets/maps/coworking-campus-v2.png",
    chatRooms: [
      { id: "sequoia-suite", name: "Sequoia Suite", bounds: { x: 4, y: 9, width: 11, height: 8 } },
      { id: "aurora-suite", name: "Aurora Suite", bounds: { x: 37, y: 9, width: 11, height: 8 } },
      { id: "lantern-cafe", name: "Lantern Café", bounds: { x: 16, y: 9, width: 20, height: 8 } },
      { id: "foundry", name: "The Foundry", bounds: { x: 4, y: 18, width: 16, height: 10 } },
      { id: "garden-lounge", name: "Garden Lounge", bounds: { x: 21, y: 18, width: 10, height: 10 } },
      { id: "lookout", name: "The Lookout", bounds: { x: 32, y: 18, width: 16, height: 10 } },
      { id: "maple-cafe", name: "Maple Café", bounds: { x: 4, y: 29, width: 13, height: 5 } },
      { id: "pond-pavilion", name: "Pond Pavilion", bounds: { x: 18, y: 29, width: 16, height: 5 } },
      { id: "sunrise-cafe", name: "Sunrise Café", bounds: { x: 35, y: 29, width: 13, height: 5 } },
    ],
  },
};

export function isMapTemplateId(value: unknown): value is MapTemplateId {
  return typeof value === "string" && MAP_TEMPLATE_IDS.includes(value as MapTemplateId);
}

export function getMapTemplate(value: unknown): MapTemplateDefinition {
  return MAP_TEMPLATES[isMapTemplateId(value) ? value : DEFAULT_MAP_TEMPLATE];
}

export function getChatRoomAtPosition(
  templateId: unknown,
  position: { x: number; y: number },
): ChatRoomZone | null {
  const template = getMapTemplate(templateId);
  return template.chatRooms.find(({ bounds }) => (
    position.x >= bounds.x
    && position.y >= bounds.y
    && position.x < bounds.x + bounds.width
    && position.y < bounds.y + bounds.height
  )) ?? null;
}

export function getChatRoom(templateId: unknown, roomId: string): ChatRoomZone | null {
  return getMapTemplate(templateId).chatRooms.find((room) => room.id === roomId) ?? null;
}
