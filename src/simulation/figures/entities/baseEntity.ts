import { getInstanceName } from "../../../coreDecorators/className";
import { WorldTerrain } from "../../world/worldGenerator";
import { Actor } from "../actors/actor";
import { GlobalServices } from "../service/globalServices";

export class BaseEntity<T> {
	private actorInstance?: Actor;

	constructor(protected entityProperties: T, actorInstance?: Actor) {
		if (actorInstance) {
			this.actorInstance = actorInstance;
			this.actorInstance.addEntityToActor(this);
		}
	}

	protected getActorInstance() {
		if (!this.actorInstance) throw `No Actor registered to ${getInstanceName(this)}`;

		return this.actorInstance;
	}

	public registerActorToEntity(actor: Actor) {
		if (this.actorInstance) throw `An Actor Instance was already registered for ${getInstanceName(this)}`;
		this.actorInstance = actor;
	}

	public getProperty<K extends keyof T>(property: K): T[K] {
		return this.entityProperties[property];
	}

	public setProperty<K extends keyof T>(property: K, value: T[K]) {
		this.entityProperties[property] = value;
	}

	act(terrain: WorldTerrain, otherActors: Actor[], delta: number, globalServices: GlobalServices) {}
}
