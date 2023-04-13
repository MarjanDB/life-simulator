import { BaseEntity } from "../entities/baseEntity";
import { WorldTerrain } from "../../world/worldGenerator";

export class Actor {
	protected readonly entities: BaseEntity<any>[] = [];
	protected shouldDelete: boolean = false;

	constructor(entities: BaseEntity<any>[] = []) {
		for (const entity of entities) {
			this.addEntityToActor(entity);
		}
	}

	public shouldBeDeleted() {
		return this.shouldDelete;
	}

	public markForDeletion() {
		this.shouldDelete = true;
	}

	public addEntityToActor(entity: BaseEntity<any>) {
		const existing = this.entities.find((v) => v.name === entity.name) !== undefined;
		if (existing) return;
		entity.registerActorToEntity(this);
		this.entities.push(entity);
	}

	public getEntityFromActor(name: string) {
		const entity = this.entities.find((v) => v.name === name);
		if (!entity) throw `Entity ${name} not found on instance of actor`;
		return entity;
	}

	public act(terrain: WorldTerrain, otherActors: Actor[], delta: number) {
		for (const entity of this.entities) {
			entity.act(terrain, otherActors, delta);
		}
	}
}
