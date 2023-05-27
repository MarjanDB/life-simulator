import { Vector2 } from "three";
import MovementCalculator from "../movementCalculator";
import { Terrain } from "../../world/worldGenerator";
import { GlobalServices } from "../../figures/service/globalServices";
import _ from "lodash";

describe("movementCalculator", () => {
	it("doesn't move on creation", () => {
		const calculator = new MovementCalculator();
		const movement = calculator.getFinalMovement();
		expect(movement.length()).toBe(0);
	});

	it("does move on movement addition", () => {
		const calculator = new MovementCalculator();
		calculator.addToMovement(new Vector2(1, 1));
		const movement = calculator.getFinalMovement();
		expect(movement.length()).toBeCloseTo(1);
	});

	it("has a normalized length", () => {
		const calculator = new MovementCalculator();
		calculator.addToMovement(new Vector2(1, 1));
		calculator.addToMovement(new Vector2(10, 10));
		const movement = calculator.getFinalMovement();
		expect(movement.length()).toBeCloseTo(1);
	});

	it("calculates direction based on movement length", () => {
		const calculator = new MovementCalculator();
		calculator.addToMovement(new Vector2(1, 0));
		calculator.addToMovement(new Vector2(0, 10));
		const movement = calculator.getFinalMovement();
		expect(movement.y).toBeGreaterThan(movement.x);
	});

	it("does not change the movement of an object at rest", () => {
		const world = Terrain.generateTerrain({ size: 3, seed: "test", resolution: 100 }, new GlobalServices());
		const borders = _.flatten(world).filter((v) => v.type === "BORDER");
		const movement = new Vector2(0, 0);
		const position = new Vector2(1, 1);
		const modifiedMovement = MovementCalculator.applyBarrierRepulsionMultiplier(position, movement, borders);

		expect(modifiedMovement).toEqual(movement);
	});

	it("prevents moving directly into an obstruction", () => {
		const world = Terrain.generateTerrain({ size: 3, seed: "test", resolution: 100 }, new GlobalServices());
		const borders = _.flatten(world).filter((v) => v.type === "BORDER");
		const movement = new Vector2(-1, 0);
		const position = new Vector2(0.5, 1);
		const modifiedMovement = MovementCalculator.applyBarrierRepulsionMultiplier(position, movement, borders);

		expect(modifiedMovement).not.toEqual(movement);
		expect(modifiedMovement.x).toBeCloseTo(0);
	});

	it("it does not prevent moving away from an obstruction", () => {
		const world = Terrain.generateTerrain({ size: 5, seed: "test", resolution: 100 }, new GlobalServices());
		const borders = _.flatten(world).filter((v) => v.type === "BORDER");
		const movement = new Vector2(1, 0);
		const position = new Vector2(0.5, 3);
		const modifiedMovement = MovementCalculator.applyBarrierRepulsionMultiplier(position, movement, borders);

		expect(modifiedMovement).toEqual(movement);
	});
});
