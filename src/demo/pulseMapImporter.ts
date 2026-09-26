import {
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";

export interface PulseMapObject {
  id: number | string;
  type: string;
  name?: string;
  position?: {
    x?: number;
    y?: number;
    z?: number;
  };
  rotation?: {
    x?: number;
    y?: number;
    z?: number;
  };
  scale?: {
    x?: number;
    y?: number;
    z?: number;
  };
  interior?: number;
  dimension?: number;
  metadata?: Record<string, unknown>;
}

export interface PulseMapFile {
  format: "PULSE_MAP";
  version: number;
  game?: string;
  map_name?: string;
  description?: string;
  server?: {
    host?: string;
    port?: number;
  };
  spawn?: {
    x?: number;
    y?: number;
    z?: number;
    rotation?: number;
  };
  districts?: unknown[];
  objects: PulseMapObject[];
  factions?: unknown[];
  jobs?: unknown[];
  systems?: Record<string, unknown>;
}

const materials = new Map<string, StandardMaterial>();

function getMaterial(scene: Scene, type: string): StandardMaterial {
  const cached = materials.get(type);

  if (cached && !cached.isDisposed()) {
    return cached;
  }

  const material = new StandardMaterial(
    `pulse-map-material-${type}`,
    scene,
  );

  material.diffuseColor = getColor(type);
  material.specularColor = Color3.Black();

  materials.set(type, material);

  return material;
}

function getColor(type: string): Color3 {
  switch (type) {
    case "road":
      return new Color3(0.08, 0.08, 0.08);

    case "intersection":
      return new Color3(0.12, 0.12, 0.12);

    case "bridge":
      return new Color3(0.18, 0.18, 0.2);

    case "house":
      return new Color3(0.65, 0.52, 0.38);

    case "apartment":
      return new Color3(0.48, 0.52, 0.58);

    case "shop":
    case "supermarket":
    case "clothing_store":
    case "restaurant":
    case "cafe":
      return new Color3(0.15, 0.45, 0.75);

    case "gas_station":
      return new Color3(0.8, 0.55, 0.08);

    case "hospital":
      return new Color3(0.85, 0.85, 0.85);

    case "police":
      return new Color3(0.08, 0.2, 0.55);

    case "fire_station":
      return new Color3(0.75, 0.08, 0.05);

    case "airport":
      return new Color3(0.35, 0.35, 0.4);

    case "port":
      return new Color3(0.08, 0.35, 0.45);

    case "bank":
      return new Color3(0.35, 0.55, 0.25);

    case "hotel":
      return new Color3(0.55, 0.25, 0.65);

    case "district":
      return new Color3(0.1, 0.7, 0.35);

    default:
      return new Color3(0.55, 0.55, 0.55);
  }
}

function getDimensions(type: string): {
  width: number;
  height: number;
  depth: number;
} {
  switch (type) {
    case "road":
      return {
        width: 18,
        height: 0.25,
        depth: 90,
      };

    case "intersection":
      return {
        width: 45,
        height: 0.3,
        depth: 45,
      };

    case "bridge":
      return {
        width: 24,
        height: 2,
        depth: 100,
      };

    case "house":
      return {
        width: 20,
        height: 10,
        depth: 20,
      };

    case "apartment":
      return {
        width: 30,
        height: 35,
        depth: 30,
      };

    case "gas_station":
      return {
        width: 35,
        height: 6,
        depth: 25,
      };

    case "airport":
      return {
        width: 150,
        height: 2,
        depth: 100,
      };

    case "port":
      return {
        width: 120,
        height: 2,
        depth: 80,
      };

    default:
      return {
        width: 18,
        height: 8,
        depth: 18,
      };
  }
}

function createObject(
  scene: Scene,
  object: PulseMapObject,
): Mesh {
  const type = object.type || "object";
  const dimensions = getDimensions(type);

  const mesh = MeshBuilder.CreateBox(
    `pulse-map-${object.id}-${type}`,
    {
      width: dimensions.width,
      height: dimensions.height,
      depth: dimensions.depth,
    },
    scene,
  );

  const position = object.position ?? {};
  const rotation = object.rotation ?? {};
  const scale = object.scale ?? {};

  mesh.position = new Vector3(
    position.x ?? 0,
    position.y ?? 0,
    position.z ?? 0,
  );

  mesh.rotation = new Vector3(
    rotation.x ?? 0,
    rotation.y ?? 0,
    rotation.z ?? 0,
  );

  mesh.scaling = new Vector3(
    scale.x ?? 1,
    scale.y ?? 1,
    scale.z ?? 1,
  );

  mesh.material = getMaterial(scene, type);

  mesh.metadata = {
    pulseMap: true,
    id: object.id,
    type,
    name: object.name ?? type,
    interior: object.interior ?? 0,
    dimension: object.dimension ?? 0,
    metadata: object.metadata ?? {},
  };

  mesh.isPickable = true;

  return mesh;
}

export function clearPulseMap(scene: Scene): void {
  const meshes = scene.meshes.filter(
    (mesh) => mesh.metadata?.pulseMap === true,
  );

  for (const mesh of meshes) {
    mesh.dispose(false, true);
  }
}

export function importPulseMapText(
  scene: Scene,
  serialized: string,
): PulseMapFile {
  const map = JSON.parse(serialized) as PulseMapFile;

  if (map.format !== "PULSE_MAP") {
    throw new Error(
      `Неверный формат карты: ${String(map.format)}`,
    );
  }

  if (!Array.isArray(map.objects)) {
    throw new Error("В PULSE_MAP отсутствует массив objects.");
  }

  clearPulseMap(scene);

  for (const object of map.objects) {
    createObject(scene, object);
  }

  scene.metadata = {
    ...(scene.metadata ?? {}),
    pulseMap: map,
  };

  return map;
  }
