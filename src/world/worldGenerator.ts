import Perlin from "pf-perlin";
import { Vector2, Vector3 } from "three";

export type TerrainType = "WATER" | "GRASS" | "FOREST" | "SAND" | "MOUNTAIN" | "MOUNTAIN PEAK" | "BORDER";

export type WorldTerrain = Terrain[][];

export type WorldTerrainGeneratorParams = {
	seed: string;
	size: number;
	resolution: number;
};

export type Position = {
	position: THREE.Vector3;
};

export class Actor implements Position {
	age: number;

	constructor(public position: THREE.Vector3, public size: number) {
		this.age = 0;
	}
}

export type DirectionAndDistance = {
	distance: number;
	direction: Vector2;
};

export class Terrain implements Position {
	constructor(public readonly type: TerrainType, public readonly position: Vector3) {}

	static getTerrainOnPosition(x: number, y: number, terrain: WorldTerrain): Terrain | null {
		const xIndex = Math.floor(x);
		const yIndex = Math.floor(y);

		return terrain[yIndex][xIndex];
	}

	public getMyColor() {
		switch (this.type) {
			case "BORDER":
				return "black";
			case "FOREST":
				return "darkGreen";
			case "GRASS":
				return "green";
			case "MOUNTAIN":
				return "gray";
			case "MOUNTAIN PEAK":
				return "dimGray";
			case "SAND":
				return "gold";
			case "WATER":
				return "skyBlue";
		}
	}
}

export function generateTerrain(params: WorldTerrainGeneratorParams): WorldTerrain {
	const seed = params.seed;
	const size = params.size + 2;
	const resolution = params.resolution;
	const generator = new Perlin({ seed: seed, dimensions: 2, wavelength: 1 });

	const generatedTerrain: number[][] = [];
	for (let y = 0; y < size; y++) {
		const row: number[] = [];

		for (let x = 0; x < size; x++) {
			const value = generator.get([x / resolution, y / resolution]);
			row.push(value);
		}

		generatedTerrain.push(row);
	}

	const getTerrainCategoryFromHeight = (height: number): TerrainType => {
		if (height < 0.4) return "WATER";
		if (height < 0.425) return "SAND";
		if (height < 0.7) return "GRASS";
		if (height < 0.85) return "FOREST";
		if (height < 0.95) return "MOUNTAIN";

		return "MOUNTAIN PEAK";
	};

	const parseTerrainBlock = (x: number, y: number, height: number): Terrain => {
		const position = new Vector3(x, y, height * 10);
		let terrainType = getTerrainCategoryFromHeight(height);

		// Override terrain type if this is a border
		if (x === 0 || y === 0 || y === size - 1 || x === size - 1) terrainType = "BORDER";

		return new Terrain(terrainType, position);
	};

	const terrain = generatedTerrain.map((row, y) => row.map((v, x) => parseTerrainBlock(x, y, v)));

	console.log("terrain", terrain);

	return terrain;
}

export function createRandomPosition(terrain: WorldTerrain) {
	const worldSize = terrain.length - 15;

	const y = 7 + worldSize * Math.random();
	const x = 7 + worldSize * Math.random();

	const matchingTerrain = Terrain.getTerrainOnPosition(x, y, terrain);

	if (!matchingTerrain) throw `Terrain does not exist for position y: ${y} | x: ${x}`;

	const z = matchingTerrain.position.z;

	return new Vector3(x, y, z);
}
