import { Vector2 } from "three";
import { MINIMUM_BORDER_DISTANCE, WorldTerrain } from "../world/worldGenerator";

export default class MovementCalculator {
	length: number = 0;
	private movement: Vector2 = new Vector2(0, 0);
	constructor() {}

	public addToMovement(movement: Vector2) {
		const length = movement.length();
		this.movement.add(movement);
		this.length += length;
	}

	public setToMovement(movement: Vector2) {
		this.movement.set(movement.x, movement.y);
		this.length = this.movement.length();
	}

	public getFinalMovement() {
		if (this.length === 0) return this.movement.clone();

		return this.movement.clone().divideScalar(this.length);
	}

	public static getBorderRepulsion(terrain: WorldTerrain, currentPossition: Vector2) {
		const totalForce = new Vector2(0, 0);
		const x = currentPossition.x;
		const y = currentPossition.y;

		const closestX = Math.floor(Math.round(x / terrain.length) * terrain.length);
		const closestY = Math.floor(Math.round(y / terrain.length) * terrain.length);

		const closestBorderX = new Vector2(closestX, y);
		const closestBorderY = new Vector2(x, closestY);

		const diffX = closestBorderX.sub(currentPossition).clampLength(0, MINIMUM_BORDER_DISTANCE);
		const diffLengthX = diffX.length();
		totalForce.add(diffX.multiplyScalar(MINIMUM_BORDER_DISTANCE - diffLengthX).multiplyScalar(-5));

		const diffY = closestBorderY.sub(currentPossition).clampLength(0, MINIMUM_BORDER_DISTANCE);
		const diffLengthY = diffY.length();
		totalForce.add(diffY.multiplyScalar(MINIMUM_BORDER_DISTANCE - diffLengthY).multiplyScalar(-5));

		return totalForce;
	}

	public static randomMovement(multiplier = 1) {
		const x = Math.random() - 0.5;
		const y = Math.random() - 0.5;

		const direction = new Vector2(x, y).normalize();

		return direction.multiplyScalar(multiplier);
	}
}
