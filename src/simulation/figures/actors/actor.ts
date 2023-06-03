import { BaseEntity } from "../entities/baseEntity";
import { WorldTerrain } from "../../world/worldGenerator";
import { GlobalServices } from "../service/globalServices";
import { getInstanceName, getName } from "../../../coreDecorators/className";

export class Actor {
	protected readonly entities: Map<string, BaseEntity<any>> = new Map();
	private entityQueue: BaseEntity<any>[] = [];
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
		this.entityQueue.push(entity);
	}

	public removeEntityFromActor<T extends BaseEntity<any>>(entity: new (...args: any[]) => T) {
		const entityKey = getName(entity);
		const entry = this.entities.get(entityKey);
		if (!entry) return;

		entry.unRegisterActorFromEntity();
		this.entities.delete(entityKey);
		this.entityQueue = Array.from(this.entities.values());
		this.reorderEntityQueue();
	}

	protected reorderEntityQueue() {
		this.entityQueue.sort((a, b) => a.priority - b.priority);
	}

	public getEntityFromActor<T extends BaseEntity<any>>(entity: new (...args: any[]) => T): T {
		const entityKey = getName(entity);
		const existing = this.entities.has(entityKey);
		if (!existing) throw `Entity ${entityKey} not found on instance of actor`;
		return this.entities.get(entityKey) as T;
	}

	public tryGetEntityFromActor<T extends BaseEntity<any>>(entity: new (...args: any[]) => T): T | null {
		try {
			return this.getEntityFromActor(entity);
		} catch (ex) {
			return null;
		}
	}

	public getGlobalServices() {
		return this.globalServices;
	}

	public getAllEntities() {
		return this.entities.values();
	}

	public act(terrain: WorldTerrain, otherActors: Actor[], delta: number, globalServices: GlobalServices) {
		for (const entity of this.entityQueue) {
			entity.act(terrain, otherActors, delta, globalServices);
		}
	}
}
