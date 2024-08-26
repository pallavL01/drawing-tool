/* tslint:disable */
/* eslint-disable */
/**
*/
export class Particle {
  free(): void;
/**
* @param {number} x
* @param {number} y
* @param {number} vx
* @param {number} vy
* @param {number} mass
* @returns {Particle}
*/
  static new(x: number, y: number, vx: number, vy: number, mass: number): Particle;
/**
* @param {number} gravity
* @param {number} time_step
*/
  update(gravity: number, time_step: number): void;
/**
* @returns {number}
*/
  get_x(): number;
/**
* @returns {number}
*/
  get_y(): number;
}
/**
*/
export class World {
  free(): void;
/**
* @param {number} gravity
* @param {number} time_step
* @returns {World}
*/
  static new(gravity: number, time_step: number): World;
/**
* @param {number} x
* @param {number} y
* @param {number} vx
* @param {number} vy
* @param {number} mass
*/
  add_particle(x: number, y: number, vx: number, vy: number, mass: number): void;
/**
*/
  update(): void;
/**
* @returns {Float32Array}
*/
  get_particle_positions(): Float32Array;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_particle_free: (a: number, b: number) => void;
  readonly particle_new: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly particle_update: (a: number, b: number, c: number) => void;
  readonly particle_get_x: (a: number) => number;
  readonly particle_get_y: (a: number) => number;
  readonly __wbg_world_free: (a: number, b: number) => void;
  readonly world_new: (a: number, b: number) => number;
  readonly world_add_particle: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly world_update: (a: number) => void;
  readonly world_get_particle_positions: (a: number, b: number) => void;
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
