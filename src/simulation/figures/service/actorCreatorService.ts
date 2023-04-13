import { WorldTerrain } from "../../world/worldGenerator";
import { Actor } from "../actors/actor";
import { BaseService } from "./baseService";

export class ActorCreatorService extends BaseService {
	private taskQueue: Actor[] = [];

	constructor() {
		super("ActorCreatorService");
	}

	override act(terrain: WorldTerrain, allActors: Actor[], delta: number) {
		if (this.taskQueue.length === 0) return;

		allActors.push(...this.taskQueue);
		this.taskQueue = [];
	}

	addActorToScene(actor: Actor) {
		this.taskQueue.push(actor);
	}

	addActorsToScene(actors: Actor[]) {
		this.taskQueue.push(...actors);
	}
}
