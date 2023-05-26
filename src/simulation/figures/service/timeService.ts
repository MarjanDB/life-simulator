import { Service } from "../../../coreDecorators/className";
import { WorldTerrain } from "../../world/worldGenerator";
import { Actor } from "../actors/actor";
import { BaseService } from "./baseService";

@Service("TimeService")
export class TimeService extends BaseService<{ currentTime: number }> {
	constructor() {
		super({
			currentTime: 0,
		});
	}

	act(terrain: WorldTerrain, allActors: Actor[], delta: number): void {
		this.setProperty("currentTime", this.getProperty("currentTime") + delta);
	}

	public getCurrentTime() {
		return this.getProperty("currentTime");
	}
}
