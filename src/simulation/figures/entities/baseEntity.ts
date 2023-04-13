import { WorldTerrain } from "../../world/worldGenerator";
import { Actor } from "../actors/actor";

export class BaseEntity<T> {
	private actorInstance?: Actor;

	constructor(public readonly name: string, protected entityProperties: T, actorInstance?: Actor) {
		if (actorInstance) {
			this.actorInstance = actorInstance;
			this.actorInstance.addEntityToActor(this);
		}
	}

	protected getActorInstance() {
		if (!this.actorInstance) throw `No Actor registered to ${this.name}`;

		return this.actorInstance;
	}

	public registerActorToEntity(actor: Actor) {
		if (this.actorInstance) throw `An Actor Instance was already registered for ${this.name}`;
		this.actorInstance = actor;
	}

	public getProperty<K extends keyof T>(property: K): T[K] {
		return this.entityProperties[property];
	}

	public setProperty<K extends keyof T>(property: K, value: T[K]) {
		this.entityProperties[property] = value;
	}

	act(terrain: WorldTerrain, otherActors: Actor[], delta: number) {}
}
