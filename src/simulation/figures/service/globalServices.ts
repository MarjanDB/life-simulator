import { Service } from "../../../coreDecorators/className";
import { getInstanceName, getName } from "../../../coreDecorators/className";
import { WorldTerrain } from "../../world/worldGenerator";
import { Actor } from "../actors/actor";
import { BaseService } from "./baseService";

@Service("GlobalServices")
export class GlobalServices extends BaseService<{ services: Map<string, BaseService<any>> }> {
	constructor() {
		super({ services: new Map() });
	}

	getServiceInstance<T extends BaseService<any>>(service: new (...args: any[]) => T): T {
		const classKey = getName(service);
		console.log(classKey);
		const hasService = this.getProperty("services").has(classKey);
		if (!hasService) throw `Unable to find service ${classKey}`;

		return this.getProperty("services").get(classKey) as T;
	}

	addServiceInstance<T extends BaseService<any>>(service: T) {
		const classKey = getInstanceName(service);
		const exists = this.getProperty("services").has(classKey);
		if (exists) return;

		this.getProperty("services").set(classKey, service);
		service.registerService(this);
	}

	act(terrain: WorldTerrain, allActors: Actor[], delta: number): void {
		for (const service of this.getProperty("services").values()) {
			service.act(terrain, allActors, delta);
		}
	}
}
