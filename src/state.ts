import { WorldTerrain, WorldTerrainGeneratorParams } from "./simulation/world/worldGenerator";
import { create } from "zustand";
import { Actor } from "./simulation/figures/actors/actor";

type worldState = WorldTerrainGeneratorParams & {
	terrain: WorldTerrain;
	setSize: (size: number) => void;
	setSeed: (seed: string) => void;
	setResolution: (resolution: number) => void;
	setTerrain: (terrain: WorldTerrain) => void;
};

type actorState = {
	actors: Actor[];
	setActors: (actors: Actor[]) => void;
};

type simulationState = {
	mutationVariation: number;
	mutationRate: number;
	intervalTillFoodGeneration: number;
	foodGeneratedPerInterval: number;
	running: boolean;
	setMutationVariation: (variation: number) => void;
	setMutationRate: (rate: number) => void;
	setFoodGenerationInterval: (interval: number) => void;
	setFoodGenerationPerInterval: (numberOfFood: number) => void;
	setRunning: (state: boolean) => void;
};

type initialPreyProperties = {
	detectionRadius: number;
	speed: number;
	size: number;
	instances: number;
	setDetectionRadius: (radius: number) => void;
	setSpeed: (speed: number) => void;
	setSize: (size: number) => void;
	setInstanceCount: (number: number) => void;
};

type initialHunterProperties = {
	detectionRadius: number;
	speed: number;
	size: number;
	instances: number;
	setDetectionRadius: (radius: number) => void;
	setSpeed: (speed: number) => void;
	setSize: (size: number) => void;
	setInstanceCount: (number: number) => void;
};

export const WORLD_STATE = create<worldState>()((set) => ({
	terrain: [],
	resolution: 100,

	// tess 100 -> water in center
	// testingas 50 -> hilly kind of
	// 52FAfsdasa 50 -> watery choke
	// 52dasa 25 -> overall
	// testidas 20 -> overall
	seed: "testing seed",

	size: 50,
	setSize: (size) => set({ size: size }),
	setResolution: (resolution) => set({ resolution: resolution }),
	setSeed: (seed) => set({ seed: seed }),
	setTerrain: (terrain: WorldTerrain) => set({ terrain: terrain }),
}));

export const ACTOR_STATE = create<actorState>()((set) => ({
	actors: [],
	setActors: (actors) => set({ actors: actors }),
}));

export const SIMULATION_STATE = create<simulationState>()((set) => ({
	mutationVariation: 0.1,
	mutationRate: 0.1,
	intervalTillFoodGeneration: 5,
	foodGeneratedPerInterval: 5,
	running: false,
	setMutationVariation: (variation) => set({ mutationVariation: variation }),
	setMutationRate: (rate) => set({ mutationRate: rate }),
	setFoodGenerationInterval: (interval) => set({ intervalTillFoodGeneration: interval }),
	setFoodGenerationPerInterval: (numberOfFood) => set({ foodGeneratedPerInterval: numberOfFood }),
	setRunning: (state) => set({ running: state }),
}));

export const INITIAL_PREY_PROPERTIES = create<initialPreyProperties>()((set) => ({
	detectionRadius: 20,
	speed: 2,
	size: 0.35,
	instances: 15,
	setDetectionRadius: (radius) => set({ detectionRadius: radius }),
	setSpeed: (speed) => set({ speed: speed }),
	setSize: (size) => set({ size: size }),
	setInstanceCount: (number) => set({ instances: number }),
}));

export const INITIAL_HUNTER_PROPERTIES = create<initialHunterProperties>()((set) => ({
	detectionRadius: 25,
	speed: 3,
	size: 0.5,
	instances: 10,
	setDetectionRadius: (radius) => set({ detectionRadius: radius }),
	setSpeed: (speed) => set({ speed: speed }),
	setSize: (size) => set({ size: size }),
	setInstanceCount: (number) => set({ instances: number }),
}));
