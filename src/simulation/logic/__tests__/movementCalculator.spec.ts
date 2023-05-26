import { Vector2 } from "three";
import MovementCalculator from "../movementCalculator";
import { Terrain } from "../../world/worldGenerator";
import { GlobalServices } from "../../figures/service/globalServices";

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

	it("can calculate a border repelling force", () => {
		const world = Terrain.generateTerrain({ size: 3, seed: "test", resolution: 100 }, new GlobalServices());
		const repulsion = MovementCalculator.getBorderRepulsion(world, new Vector2(1, 1));
		expect(repulsion.x).toBeGreaterThan(1);
		expect(repulsion.y).toBeGreaterThan(1);

		const repulsionInverse = MovementCalculator.getBorderRepulsion(world, new Vector2(3, 3));
		expect(repulsionInverse.x).toBeLessThan(-1);
		expect(repulsionInverse.y).toBeLessThan(-1);
	});
});
