import Perlin from "pf-perlin";
import { Vector3 } from "three";
import { Actor } from "../figures/actors/actor";
import { PositionEntity } from "../figures/entities/positionEntity";
import { ShapeEntity } from "../figures/entities/shapeEntity";
import { GlobalServices } from "../figures/service/globalServices";

export const MINIMUM_BORDER_DISTANCE = 3;

export type TerrainType = "WATER" | "DEEP WATER" | "GRASS" | "FOREST" | "SAND" | "MOUNTAIN" | "MOUNTAIN PEAK" | "BORDER";

export type WorldTerrain = Terrain[][];

export type WorldTerrainGeneratorParams = {
	seed: string;
	size: number;
	resolution: number;
};

export class Terrain extends Actor {
	constructor(globalServices: GlobalServices, public type: TerrainType, position: Vector3) {
		const positionEntity = new PositionEntity(position);
		const shapeEntity = new ShapeEntity(1, "BOX");
		super(globalServices, [positionEntity, shapeEntity]);
	}

	public static getTerrainOnPosition(x: number, y: number, terrain: WorldTerrain): Terrain {
		const xIndex = Math.floor(x);
		const yIndex = Math.floor(y);

		const matchingTerrain = terrain[yIndex][xIndex];

		return matchingTerrain;
	}

	public static generateTerrain(params: WorldTerrainGeneratorParams, globalServices: GlobalServices): WorldTerrain {
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

			return new Terrain(globalServices, terrainType, position);
		};

		const terrain = generatedTerrain.map((row, y) => row.map((v, x) => parseTerrainBlock(x, y, v)));

		// Detect and assign deep water
		for (let y = 1; y < size - 1; y++) {
			for (let x = 1; x < size - 1; x++) {
				const top = terrain[y - 1][x];
				const bottom = terrain[y + 1][x];
				const left = terrain[y][x - 1];
				const right = terrain[y][x + 1];

				const types = [top, bottom, left, right].map((v) => v.type);
				const allWaterTypes = types.reduce((prev, cur) => prev && (cur === "WATER" || cur === "DEEP WATER"), true);
				if (!allWaterTypes) continue;

				terrain[y][x].type = "DEEP WATER";
			}
		}

		console.log("terrain", terrain);

		return terrain;
	}

	public static getRandomPosition(terrain: WorldTerrain) {
		const worldSize = terrain.length;
		const lowerWorldLimit = MINIMUM_BORDER_DISTANCE;
		const upperWorldLimit = worldSize - MINIMUM_BORDER_DISTANCE;

		const validYPositions = terrain.filter((v, y) => y > lowerWorldLimit && y < upperWorldLimit);
		const validPositions = validYPositions
			.map((v) => v.filter((t, x) => x > lowerWorldLimit && x < upperWorldLimit && t.type !== "WATER" && t.type !== "DEEP WATER"))
			.filter((v) => v.length > 0);

		if (validPositions.length === 0) throw `No position to generate on`;

		const y = validYPositions.length * Math.random();
		const x = validPositions[Math.floor(y)].length * Math.random();

		const matchingTerrain = Terrain.getTerrainOnPosition(x, y, validPositions);

		if (!matchingTerrain) throw `Terrain does not exist for position y: ${y} | x: ${x}`;

		const positionEntity = matchingTerrain.getEntityFromActor("PositionEntity") as PositionEntity;

		return positionEntity.getProperty("position").clone();
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
			case "DEEP WATER":
				return "blue";
		}
	}
}
