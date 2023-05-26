import { Service } from "../../../coreDecorators/className";
import { WorldTerrain } from "../../world/worldGenerator";
import { Actor } from "../actors/actor";
import { ActorCreatorService } from "./actorCreatorService";
import { BaseService } from "./baseService";

export type Spawner = {
	afterSeconds: number;
	generator: () => Actor;
	numberToGenerate: number;
};

type SpawnerCounter = Spawner & {
	elapsed: number;
};

@Service("IntervalSpawnerService")
export class IntervalSpawnerService extends BaseService<{ spawners: SpawnerCounter[] }> {
	constructor() {
		super({
			spawners: [],
		});
	}

	addSpawner(afterSeconds: number, generator: () => Actor, numberToGenerate: number) {
		this.getProperty("spawners").push({
			afterSeconds,
			generator,
			numberToGenerate,
			elapsed: 0,
		});
	}

	act(terrain: WorldTerrain, allActors: Actor[], delta: number): void {
		for (const spawner of this.getProperty("spawners")) {
			spawner.elapsed += delta;

			const shouldSpawn = spawner.elapsed > spawner.afterSeconds;
			if (!shouldSpawn) continue;

			const actorCreatorService = this.getGlobalServices().getServiceInstance(ActorCreatorService);

			spawner.elapsed = 0;
			const toSpawn = Array.from({ length: spawner.numberToGenerate }).map(spawner.generator);

			actorCreatorService.addActorsToScene(toSpawn);
		}
	}
}
