import { getInstanceName } from "../../../coreDecorators/className";
import { WorldTerrain } from "../../world/worldGenerator";
import { Actor } from "../actors/actor";
import { GlobalServices } from "./globalServices";

export abstract class BaseService<T> {
	private globalServices?: GlobalServices;

	constructor(private entityProperties: T, globalService?: GlobalServices) {
		if (globalService) {
			this.globalServices = globalService;
			this.globalServices.addServiceInstance(this);
		}
	}

	protected getGlobalServices() {
		if (!this.globalServices) throw `No GlobalServices registered to ${getInstanceName(this)}`;

		return this.globalServices;
	}

	public registerService(globalServices: GlobalServices) {
		if (this.globalServices) throw `An GlobalServices Instance was already registered for ${getInstanceName(this)}`;
		this.globalServices = globalServices;
	}

	public getProperty<K extends keyof T>(property: K): T[K] {
		return this.entityProperties[property];
	}

	public setProperty<K extends keyof T>(property: K, value: T[K]) {
		this.entityProperties[property] = value;
	}

	abstract act(terrain: WorldTerrain, otherActors: Actor[], delta: number): void;
}
