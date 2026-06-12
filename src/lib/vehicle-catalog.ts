import type { CompatibleVehicle } from '../dubicolt/types';

export interface VehicleCatalog {
  makes: string[];
  modelsByMake: Record<string, string[]>;
  years: number[];
  yearsByMakeModel: Record<string, number[]>;
  enginesByMakeModel: Record<string, string[]>;
}

function makeModelKey(make: string, model: string): string {
  return `${make}|${model}`;
}

function addUniqueSorted(values: Set<string | number>, value: string | number) {
  values.add(value);
}

export function buildVehicleCatalog(vehicles: CompatibleVehicle[]): VehicleCatalog {
  const makes = new Set<string>();
  const modelsByMake = new Map<string, Set<string>>();
  const years = new Set<number>();
  const yearsByMakeModel = new Map<string, Set<number>>();
  const enginesByMakeModel = new Map<string, Set<string>>();

  for (const vehicle of vehicles) {
    if (!vehicle.make || !vehicle.model) continue;

    addUniqueSorted(makes, vehicle.make);

    if (!modelsByMake.has(vehicle.make)) modelsByMake.set(vehicle.make, new Set());
    modelsByMake.get(vehicle.make)!.add(vehicle.model);

    const key = makeModelKey(vehicle.make, vehicle.model);
    if (!yearsByMakeModel.has(key)) yearsByMakeModel.set(key, new Set());
    if (!enginesByMakeModel.has(key)) enginesByMakeModel.set(key, new Set());

    for (let year = vehicle.yearFrom; year <= vehicle.yearTo; year += 1) {
      addUniqueSorted(years, year);
      yearsByMakeModel.get(key)!.add(year);
    }

    if (vehicle.engine?.trim()) {
      enginesByMakeModel.get(key)!.add(vehicle.engine.trim());
    }
  }

  const sortStrings = (items: Iterable<string>) => Array.from(items).sort((a, b) => a.localeCompare(b));
  const sortNumbersDesc = (items: Iterable<number>) => Array.from(items).sort((a, b) => b - a);

  return {
    makes: sortStrings(makes),
    modelsByMake: Object.fromEntries(
      Array.from(modelsByMake.entries()).map(([make, models]) => [make, sortStrings(models)]),
    ),
    years: sortNumbersDesc(years),
    yearsByMakeModel: Object.fromEntries(
      Array.from(yearsByMakeModel.entries()).map(([key, yearSet]) => [key, sortNumbersDesc(yearSet)]),
    ),
    enginesByMakeModel: Object.fromEntries(
      Array.from(enginesByMakeModel.entries()).map(([key, engineSet]) => [key, sortStrings(engineSet)]),
    ),
  };
}

export function vehicleMatchesFitment(
  vehicles: CompatibleVehicle[],
  filters: { make?: string; model?: string; year?: number; engine?: string },
): boolean {
  const hasVehicleFilter = Boolean(filters.make || filters.model || filters.year || filters.engine);
  if (!hasVehicleFilter) return true;
  if (vehicles.length === 0) return false;

  return vehicles.some((vehicle) => {
    if (filters.make && vehicle.make.toLowerCase() !== filters.make.toLowerCase()) return false;
    if (filters.model && vehicle.model.toLowerCase() !== filters.model.toLowerCase()) return false;
    if (filters.year && (filters.year < vehicle.yearFrom || filters.year > vehicle.yearTo)) return false;
    if (filters.engine && vehicle.engine) {
      const requested = filters.engine.toLowerCase();
      const listed = vehicle.engine.toLowerCase();
      if (listed !== requested && !listed.includes(requested) && !requested.includes(listed)) return false;
    }
    return true;
  });
}
