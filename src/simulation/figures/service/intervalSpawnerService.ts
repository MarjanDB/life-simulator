import { WorldTerrain } from "../../world/worldGenerator";
import { Actor } from "../actors/actor";
import { ActorCreatorService } from "./actorCreatorService";
import { BaseService } from "./baseService";
import globalServices from "./globalServices";

export type Spawner = {
	afterSeconds: number;
	generator: () => Actor;
	numberToGenerate: number;
};

type SpawnerCounter = Spawner & {
	elapsed: number;
};

export class IntervalSpawnerService extends BaseService {
	spawners: SpawnerCounter[] = [];

	constructor() {
		super("IntervalSpawnerService");
	}

	addSpawner(afterSeconds: number, generator: () => Actor, numberToGenerate: number) {
		this.spawners.push({
			afterSeconds,
			generator,
			numberToGenerate,
			elapsed: 0,
		});
	}

	act(terrain: WorldTerrain, allActors: Actor[], delta: number): void {
		for (const spawner of this.spawners) {
			spawner.elapsed += delta;

			const shouldSpawn = spawner.elapsed > spawner.afterSeconds;
			if (!shouldSpawn) continue;

			const actorCreatorService = globalServices.getServiceInstance("ActorCreatorService") as ActorCreatorService;

			spawner.elapsed = 0;
			const toSpawn = Array.from({ length: spawner.numberToGenerate }).map(spawner.generator);

			actorCreatorService.addActorsToScene(toSpawn);
		}
	}
}
