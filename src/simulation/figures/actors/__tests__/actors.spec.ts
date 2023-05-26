import { BaseEntity } from "../../entities/baseEntity";
import { GlobalServices } from "../../service/globalServices";
import { Actor } from "../actor";

describe("actors", () => {
	let actor: Actor;
	beforeEach(() => {
		actor = new Actor(new GlobalServices());
	});

	it("should have no entities on creation", () => {
		const entities = Array.from(actor.getAllEntities());
		expect(entities).toHaveLength(0);
	});

	it("should accept BaseEntity instances", () => {
		const entity = new BaseEntity({});
		actor.addEntityToActor(entity);
		const actorEntityInstance = actor.getEntityFromActor(BaseEntity);
		expect(actorEntityInstance).toEqual(entity);
	});

	it("should throw on non-existant BaseEntity instance", () => {
		const toFail = () => actor.getEntityFromActor(BaseEntity);
		expect(toFail).toThrow();
	});

	it("should be possible to retrieve a BaseEntity instance", () => {
		const entity = new BaseEntity({});
		actor.addEntityToActor(entity);
		const actorEntityInstance = actor.getEntityFromActor(BaseEntity);
		expect(actorEntityInstance).toEqual(entity);
	});

	it("should be possible to mark an actor for deletion", () => {
		actor.markForDeletion("test");
		expect(actor.shouldBeDeleted()).toBeTruthy();
		expect(actor.deleteReason()).toEqual("test");
	});
});
