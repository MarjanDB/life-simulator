import { Actor } from "../../actors/actor";
import { GlobalServices } from "../../service/globalServices";
import { AgeEntity } from "../ageEntity";

describe("ageEntity", () => {
	it("starts off with no age", () => {
		const entity = new AgeEntity(null);
		expect(entity.getAge()).toEqual(0);
	});

	it("can age", () => {
		const entity = new AgeEntity(null);
		entity.act([], [], 0.2, new GlobalServices());
		expect(entity.getAge()).toBeCloseTo(0.2);
	});

	it("can die", () => {
		const entity = new AgeEntity(0.1);
		const actor = new Actor(new GlobalServices(), [entity]);
		entity.act([], [], 0.2, new GlobalServices());
		expect(actor.shouldBeDeleted()).toBeTruthy();
	});
});
