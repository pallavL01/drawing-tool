/* tslint:disable */
/* eslint-disable */
export const memory: WebAssembly.Memory;
export const __wbg_particle_free: (a: number, b: number) => void;
export const particle_new: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
export const particle_update: (a: number, b: number, c: number) => void;
export const __wbg_world_free: (a: number, b: number) => void;
export const world_new: (a: number, b: number) => number;
export const world_set_boundaries: (a: number, b: number, c: number, d: number, e: number) => void;
export const world_add_particle: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
export const world_update: (a: number) => void;
export const world_get_particle_positions: (a: number, b: number) => void;
export const world_set_gravity: (a: number, b: number) => void;
export const world_set_wind: (a: number, b: number) => void;
export const world_add_turbulence: (a: number, b: number) => void;
export const world_add_force_field: (a: number, b: number, c: number, d: number, e: number) => void;
export const __wbg_fluidsimulation_free: (a: number, b: number) => void;
export const fluidsimulation_new: () => number;
export const fluidsimulation_update: (a: number) => void;
export const __wbg_clothsimulation_free: (a: number, b: number) => void;
export const clothsimulation_new: (a: number, b: number) => number;
export const clothsimulation_update: (a: number, b: number) => void;
export const __wbindgen_add_to_stack_pointer: (a: number) => number;
export const __wbindgen_free: (a: number, b: number, c: number) => void;
