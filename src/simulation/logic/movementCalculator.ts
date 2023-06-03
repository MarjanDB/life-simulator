import { Vector, Vector2 } from "three";
import { MINIMUM_BORDER_DISTANCE, Terrain, WorldTerrain } from "../world/worldGenerator";
import { VisibleActor } from "../figures/entities/observerEntity";
import { Actor } from "../figures/actors/actor";
import { PositionEntity } from "../figures/entities/positionEntity";
import _ from "lodash";

const MINIMUM_WATER_DISTANCE = 1;

export default class MovementCalculator {
	private movement: Vector2 = new Vector2(0, 0);
	constructor() {}

	public addToMovement(movement: Vector2) {
		this.movement.add(movement);
	}

	public setToMovement(movement: Vector2) {
		this.movement.set(movement.x, movement.y);
	}

	public getFinalMovement() {
		const normalized = this.movement.clone().normalize();
		return normalized;
	}

	public static applyBarrierRepulsionMultiplier(currentPossition: Vector2, movement: Vector2, ...barriers: Terrain[][]) {
		const biggestPositive = new Vector2(0, 0);
		const biggestNegative = new Vector2(0, 0);

		for (const barrier of barriers) {
			const barrierDistances = barrier.map((v) => {
				const positionEntity = v.getEntityFromActor(PositionEntity);
				return positionEntity.distanceToPosition(currentPossition);
			});

			const nearbyBarriers = barrierDistances.filter((v) => v.distance < MINIMUM_BORDER_DISTANCE);
			if (nearbyBarriers.length === 0) continue;

			const barrierForces = nearbyBarriers.map((v) => {
				const dampScale = Math.min(1, (MINIMUM_BORDER_DISTANCE - v.distance + 0.5) / MINIMUM_BORDER_DISTANCE); // 1 at furthest, 0 at closest
				return v.direction.multiplyScalar(dampScale);
			});

			const barrierX = barrierForces.map((v) => v.x);
			const barrierY = barrierForces.map((v) => v.y);

			const biggestX = _.max(barrierX)!;
			const biggestY = _.max(barrierY)!;
			const smallestX = _.min(barrierX)!;
			const smallestY = _.min(barrierY)!;

			biggestPositive.x = Math.max(biggestX, biggestPositive.x);
			biggestPositive.y = Math.max(biggestY, biggestPositive.y);
			biggestNegative.x = Math.min(smallestX, biggestNegative.x);
			biggestNegative.y = Math.min(smallestY, biggestNegative.y);
		}

		// now to modify the movement direction based on obstructions
		const movementDirection = movement.clone();

		if (movementDirection.x > 0) {
			movementDirection.setX(movementDirection.x * (1 + biggestNegative.x));
		}

		if (movementDirection.y > 0) {
			movementDirection.setY(movementDirection.y * (1 + biggestNegative.y));
		}

		if (movementDirection.x < 0) {
			movementDirection.setX(movementDirection.x * (1 - biggestPositive.x));
		}

		if (movementDirection.y < 0) {
			movementDirection.setY(movementDirection.y * (1 - biggestPositive.y));
		}

		return movementDirection;
	}

	public static getDeepWaterRepulsion(deepWater: VisibleActor) {
		const direction = deepWater.direction.clone();

		const clampedDistance = Math.min(deepWater.distance, MINIMUM_WATER_DISTANCE);
		const inversedDistance = MINIMUM_WATER_DISTANCE - clampedDistance;

		const force = direction.multiplyScalar(inversedDistance).multiplyScalar(-10);

		return force;
	}

	public static randomMovement(multiplier = 1) {
		const x = Math.random() - 0.5;
		const y = Math.random() - 0.5;

		const direction = new Vector2(x, y).normalize();

		return direction.multiplyScalar(multiplier);
	}
}
