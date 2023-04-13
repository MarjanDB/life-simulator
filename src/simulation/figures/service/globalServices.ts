import { WorldTerrain } from "../../world/worldGenerator";
import { Actor } from "../actors/actor";
import { BaseService } from "./baseService";

export class GlobalServices extends BaseService {
	services: BaseService[] = [];

	constructor() {
		super("GlobalService");
	}

	getServiceInstance(name: string) {
		const service = this.services.find((v) => v.name === name);
		if (service === undefined) throw `Unable to find service ${name}`;

		return service;
	}

	addServiceInstance(service: BaseService) {
		const exists = this.services.find((v) => v.name === service.name) !== undefined;
		if (exists) return;

		this.services.push(service);
	}

	act(terrain: WorldTerrain, allActors: Actor[], delta: number): void {
		for (const service of this.services) {
			service.act(terrain, allActors, delta);
		}
	}
}

export default new GlobalServices();
