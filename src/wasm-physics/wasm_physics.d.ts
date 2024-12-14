/* tslint:disable */
/* eslint-disable */
export class ClothSimulation {
  private constructor();
  free(): void;
  static new(width: number, height: number): ClothSimulation;
  update(gravity: number): void;
}
export class FluidSimulation {
  private constructor();
  free(): void;
  static new(): FluidSimulation;
  update(): void;
}
export class Particle {
  private constructor();
  free(): void;
  static new(x: number, y: number, vx: number, vy: number, mass: number, bounce: number): Particle;
  update(gravity: number, time_step: number): void;
}
export class World {
  private constructor();
  free(): void;
  static new(gravity: number, time_step: number): World;
  set_boundaries(left: number, top: number, right: number, bottom: number): void;
  add_particle(x: number, y: number, vx: number, vy: number, mass: number, bounce: number): void;
  update(): void;
  get_particle_positions(): Float32Array;
  set_gravity(gravity: number): void;
  set_wind(wind: number): void;
  add_turbulence(turbulence: number): void;
  add_force_field(x: number, y: number, strength: number, radius: number): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_particle_free: (a: number, b: number) => void;
  readonly particle_new: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly particle_update: (a: number, b: number, c: number) => void;
  readonly __wbg_world_free: (a: number, b: number) => void;
  readonly world_new: (a: number, b: number) => number;
  readonly world_set_boundaries: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly world_add_particle: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly world_update: (a: number) => void;
  readonly world_get_particle_positions: (a: number, b: number) => void;
  readonly world_set_gravity: (a: number, b: number) => void;
  readonly world_set_wind: (a: number, b: number) => void;
  readonly world_add_turbulence: (a: number, b: number) => void;
  readonly world_add_force_field: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly __wbg_fluidsimulation_free: (a: number, b: number) => void;
  readonly fluidsimulation_new: () => number;
  readonly fluidsimulation_update: (a: number) => void;
  readonly __wbg_clothsimulation_free: (a: number, b: number) => void;
  readonly clothsimulation_new: (a: number, b: number) => number;
  readonly clothsimulation_update: (a: number, b: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
