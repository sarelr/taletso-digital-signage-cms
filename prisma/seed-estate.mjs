export const initialLocations = [
  { code: "PILOT", name: "Pilot staging" },
  { code: "MAHIKENG", name: "Mahikeng Campus" },
  { code: "LICHTENBURG", name: "Lichtenburg Campus" },
  { code: "LEHURUTSHE", name: "Lehurutshe Campus" },
  { code: "CENTRAL", name: "Central Offices" },
  { code: "UNASSIGNED", name: "Unassigned" },
];

export const managedScreenIds = Array.from({ length: 12 }, (_, index) => `SCREEN-${String(index + 1).padStart(3, "0")}`);
