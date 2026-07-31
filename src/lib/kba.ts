// Historische KBA-Herstellerbezeichnungen, die heute unter dem
// Markennamen "MERCEDES-BENZ" laufen (Pkw). Daimler Truck/Buses sind
// eigenständige Unternehmen und werden bewusst NICHT zusammengeführt.
const HERSTELLER_ALIASE: Record<string, string> = {
  "DAIMLER (D)": "MERCEDES-BENZ",
  "DAIMLER-BENZ": "MERCEDES-BENZ",
  "DAIMLERCHRYSLER (D)": "MERCEDES-BENZ",
};

export function normalizeHersteller(name: string): string {
  return HERSTELLER_ALIASE[name] ?? name;
}

export function herstellerRohnamen(normalisierterName: string): string[] {
  const rohnamen = Object.entries(HERSTELLER_ALIASE)
    .filter(([, ziel]) => ziel === normalisierterName)
    .map(([roh]) => roh);
  return [normalisierterName, ...rohnamen];
}
