import { Vector2, Vector3 } from "three";
import { BaseEntity } from "./baseEntity";
import { Actor } from "../actors/actor";
import { WorldTerrain } from "../../world/worldGenerator";

export type PositionEntityProperties = {
	position: Vector3;
	positionAs2D: Vector2;
};

export type DirectionAndDistance = {
	distance: number;
	direction: Vector2;
};

export class PositionEntity extends BaseEntity<PositionEntityProperties> {
	constructor(position: Vector3) {
		super("PositionEntity", { position: position, positionAs2D: new Vector2(position.x, position.y) });
	}

	updatePosition(newPosition: { x: number; y: number; z: number }) {
		if (Number.isNaN(newPosition.x) || Number.isNaN(newPosition.y) || Number.isNaN(newPosition.z)) throw "NaN in position";

		this.getProperty("position").set(newPosition.x, newPosition.y, newPosition.z);
		this.getProperty("positionAs2D").set(newPosition.x, newPosition.y);
	}

	distanceToActor(other: Actor) {
		const otherPosition = other.getEntityFromActor(this.name) as PositionEntity;
		return this.distanceToAnother(otherPosition);
	}

	distanceToAnother(other: PositionEntity): DirectionAndDistance {
		const flattenPosition = other.getProperty("positionAs2D").clone();
		const diff = flattenPosition.sub(this.getProperty("positionAs2D"));
		const distance = diff.length();
		const normal = diff.normalize();

		return {
			direction: normal,
			distance: distance,
		};
	}
}
