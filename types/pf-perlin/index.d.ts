declare module "pf-perlin" {
	export type PerlinOptions = {
		seed?: string;
		dimensions?: number;
		min?: number;
		max?: number;
		wavelength?: number;
		octaves?: number;
		octaveScale?: number;
		persistence?: number;
		interpolation?: Function;
	};

	export default class Perlin {
		constructor(options: PerlinOptions);

		get(coordinates: number[]): number;
	}
}
