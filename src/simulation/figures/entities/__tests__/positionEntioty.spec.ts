import { Vector3 } from "three";
import { Actor } from "../../actors/actor";
import { GlobalServices } from "../../service/globalServices";
import { PositionEntity } from "../positionEntity";
import { ShapeEntity } from "../shapeEntity";

describe("PositionEntity", () => {
	let actor1: Actor;
	let actor2: Actor;
	beforeEach(() => {
		const globalServices = new GlobalServices();
		actor1 = new Actor(globalServices, [new PositionEntity(new Vector3()), new ShapeEntity(5, "SPHERE")]);
		actor2 = new Actor(globalServices, [new PositionEntity(new Vector3()), new ShapeEntity(5, "SPHERE")]);
	});

	it("can detect collisions of overlapping spheres", () => {
		actor1.getEntityFromActor(PositionEntity).updatePosition({ x: 0, y: 0, z: 0 });
		actor2.getEntityFromActor(PositionEntity).updatePosition({ x: 0, y: 0, z: 0 });

		expect(actor1.getEntityFromActor(PositionEntity).isTouchingActor(actor2)).toBeTruthy();
	});

	it("can detect collisions of touching spheres", () => {
		actor1.getEntityFromActor(PositionEntity).updatePosition({ x: 0, y: 0, z: 0 });
		actor2.getEntityFromActor(PositionEntity).updatePosition({ x: 0, y: 5, z: 0 });

		expect(actor1.getEntityFromActor(PositionEntity).isTouchingActor(actor2)).toBeTruthy();
	});
});
