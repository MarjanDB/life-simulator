import { Vector2 } from "three";
import { BaseEntity } from "./baseEntity";
import { Actor } from "../actors/actor";
import { PositionEntity } from "./positionEntity";
import { Terrain, WorldTerrain } from "../../world/worldGenerator";
import { GlobalServices } from "../service/globalServices";
import { Entity } from "../../../coreDecorators/className";

export type MovementEntityProperties = {
	maxSpeed: number;
	momentum: Vector2;
};

@Entity("MovementEntity")
export class MovementEntity extends BaseEntity<MovementEntityProperties> {
	constructor(maxSpeed: number) {
		super({ maxSpeed: maxSpeed, momentum: new Vector2() });
	}

	override act(terrain: WorldTerrain, otherActors: Actor[], delta: number, globalServices: GlobalServices): void {
		const positionEntity = this.getActorInstance().getEntityFromActor(PositionEntity);
		const currentPosition = positionEntity.getProperty("positionAs2D").clone();

		currentPosition.add(this.getProperty("momentum").clone().multiplyScalar(delta));

		positionEntity.updatePosition({ x: currentPosition.x, y: currentPosition.y });
	}

	public dampMovement(toPercentage: number) {
		this.getProperty("momentum").multiplyScalar(toPercentage);
	}

	public accelerateInDirection(direction: Vector2) {
		const currentMomentum = this.getProperty("momentum");
		const currentMomentumWeight = currentMomentum.length();
		const addedMomentumWeight = direction.length();
		const total = currentMomentumWeight + addedMomentumWeight;

		if (total === 0) return;

		currentMomentum
			.multiplyScalar(0.5 + (0.5 * (total - currentMomentumWeight)) / total)
			.add(direction.clone().multiplyScalar(0.5 + (0.5 * (total - addedMomentumWeight)) / total))
			.clampLength(0, this.getProperty("maxSpeed"));
	}
}
