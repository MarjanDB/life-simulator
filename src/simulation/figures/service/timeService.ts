import { WorldTerrain } from "../../world/worldGenerator";
import { Actor } from "../actors/actor";
import { BaseService } from "./baseService";

export class TimeService extends BaseService {
	private currentTime = 0;

	constructor() {
		super("TimeService");
	}

	act(terrain: WorldTerrain, allActors: Actor[], delta: number): void {
		this.currentTime += delta;
	}

	public getCurrentTime() {
		return this.currentTime;
	}
}
