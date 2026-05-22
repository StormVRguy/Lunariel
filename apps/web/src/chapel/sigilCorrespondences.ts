import { lunarielCorrespondences } from "lunariel-core";

export interface CorrespondenceRow {
  attribute: string;
  value: string;
  wide?: boolean;
}

/** All symbolic correspondences of Lunariel for display on the sigil page. */
export const sigilCorrespondenceRows: CorrespondenceRow[] = [
  { attribute: "Name", value: lunarielCorrespondences.name },
  { attribute: "Angelic type", value: lunarielCorrespondences.angelicType },
  { attribute: "Hierarchy", value: lunarielCorrespondences.hierarchy },
  { attribute: "Primary function", value: lunarielCorrespondences.primaryFunction },
  { attribute: "Sphere", value: lunarielCorrespondences.sphere },
  { attribute: "Sphere formula", value: lunarielCorrespondences.sphereFormula },
  { attribute: "Element", value: lunarielCorrespondences.element },
  { attribute: "Elemental formula", value: lunarielCorrespondences.elementalFormula },
  { attribute: "Virtue", value: lunarielCorrespondences.virtue },
  { attribute: "Geometry", value: lunarielCorrespondences.geometry },
  { attribute: "Number", value: String(lunarielCorrespondences.number) },
  { attribute: "Color", value: lunarielCorrespondences.color },
  { attribute: "Material", value: lunarielCorrespondences.material },
  { attribute: "Time", value: lunarielCorrespondences.time },
  { attribute: "Sound", value: lunarielCorrespondences.sound },
  { attribute: "Plant / incense", value: lunarielCorrespondences.plantOrIncense },
  { attribute: "Stone", value: lunarielCorrespondences.stone },
  {
    attribute: "Technomantic",
    value: lunarielCorrespondences.technomanticCorrespondence,
  },
  {
    attribute: "Core vow",
    value: lunarielCorrespondences.coreVow,
    wide: true,
  },
];
