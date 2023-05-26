import { Service } from "../../../coreDecorators/className";
import { WorldTerrain } from "../../world/worldGenerator";
import { Actor } from "../actors/actor";
import { BaseService } from "./baseService";

@Service("ActorCreatorService")
export class ActorCreatorService extends BaseService<{
	taskQueue: Actor[];
}> {
	constructor() {
		super({
			taskQueue: [],
		});
	}

	override act(terrain: WorldTerrain, allActors: Actor[], delta: number) {
		const taskQueue = this.getProperty("taskQueue");

		if (taskQueue.length === 0) return;

		allActors.push(...taskQueue);
		this.setProperty("taskQueue", []);
	}

	addActorToScene(actor: Actor) {
		this.getProperty("taskQueue").push(actor);
	}

	addActorsToScene(actors: Actor[]) {
		this.getProperty("taskQueue").push(...actors);
	}
}
