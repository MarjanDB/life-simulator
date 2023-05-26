import { BaseEntity } from "../entities/baseEntity";
import { WorldTerrain } from "../../world/worldGenerator";
import { GlobalServices } from "../service/globalServices";
import { getInstanceName, getName } from "../../../coreDecorators/className";

export class Actor {
	protected readonly entities: Map<string, BaseEntity<any>> = new Map();
	protected shouldDelete: boolean = false;
	protected deletionReason: string | null = null;

	constructor(protected readonly globalServices: GlobalServices, entities: BaseEntity<any>[] = []) {
		for (const entity of entities) {
			this.addEntityToActor(entity);
		}
	}

	public shouldBeDeleted() {
		return this.shouldDelete;
	}

	public deleteReason() {
		return this.deletionReason;
	}

	public markForDeletion(reason?: string) {
		this.shouldDelete = true;
		if (reason) this.deletionReason = reason;
	}

	public addEntityToActor(entity: BaseEntity<any>) {
		const entityKey = getInstanceName(entity);
		const existing = this.entities.has(entityKey);
		if (existing) return;

		entity.registerActorToEntity(this);
		this.entities.set(entityKey, entity);
	}

	public getEntityFromActor<T extends BaseEntity<any>>(entity: new (...args: any[]) => T): T {
		const entityKey = getName(entity);
		const existing = this.entities.has(entityKey);
		if (!existing) throw `Entity ${entityKey} not found on instance of actor`;
		return this.entities.get(entityKey) as T;
	}

	public getGlobalServices() {
		return this.globalServices;
	}

	public getAllEntities() {
		return this.entities.values();
	}

	public act(terrain: WorldTerrain, otherActors: Actor[], delta: number, globalServices: GlobalServices) {
		for (const entity of this.entities.values()) {
			entity.act(terrain, otherActors, delta, globalServices);
		}
	}
}
