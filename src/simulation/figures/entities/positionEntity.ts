import { Vector, Vector2, Vector3 } from "three";
import { BaseEntity } from "./baseEntity";
import { Actor } from "../actors/actor";
import { Terrain, TerrainType, WorldTerrain } from "../../world/worldGenerator";
import { Entity } from "../../../coreDecorators/className";
import { GlobalServices } from "../service/globalServices";
import { ShapeEntity } from "./shapeEntity";

export type PositionEntityProperties = {
	position: Vector3;
	positionAs2D: Vector2;
	terrainUnderMe?: Terrain;
};

export type DirectionAndDistance = {
	distance: number;
	direction: Vector2;
};

@Entity("PositionEntity")
export class PositionEntity extends BaseEntity<PositionEntityProperties> {
	constructor(position: Vector3) {
		super({ position: position, positionAs2D: new Vector2(position.x, position.y), terrainUnderMe: undefined });
	}

	updatePosition(newPosition: { x: number; y: number; z: number }) {
		if (Number.isNaN(newPosition.x) || Number.isNaN(newPosition.y) || Number.isNaN(newPosition.z)) throw "NaN in position";

		this.getProperty("position").set(newPosition.x, newPosition.y, newPosition.z);
		this.getProperty("positionAs2D").set(newPosition.x, newPosition.y);
	}

	distanceToActor(other: Actor) {
		const otherPosition = other.getEntityFromActor(PositionEntity);
		return this.distanceToAnother(otherPosition);
	}

	distanceToPosition(other: Vector2): DirectionAndDistance {
		const diff = other.clone().sub(this.getProperty("positionAs2D"));
		const distance = diff.length();
		const normal = diff.normalize();

		return {
			direction: normal,
			distance: distance,
		};
	}

	distanceToAnother(other: PositionEntity): DirectionAndDistance {
		return this.distanceToPosition(other.getProperty("positionAs2D"));
	}

	getTerrainTypeUnderMe(): TerrainType {
		const terrain = this.getProperty("terrainUnderMe");

		if (!terrain) return "BORDER";

		return terrain.type;
	}

	isTouching(other: PositionEntity) {
		const myShape = this.getActorInstance().getEntityFromActor(ShapeEntity);
		const otherShape = other.getActorInstance().getEntityFromActor(ShapeEntity);

		const positionDifference = this.getProperty("positionAs2D").clone().sub(other.getProperty("positionAs2D").clone()).length();
		const combinedShapeSize = myShape.getProperty("size") + otherShape.getProperty("size");

		return positionDifference <= combinedShapeSize;
	}

	isTouchingActor(other: Actor) {
		const otherPosition = other.getEntityFromActor(PositionEntity);
		return this.isTouching(otherPosition);
	}

	act(terrain: WorldTerrain, otherActors: Actor[], delta: number, globalServices: GlobalServices): void {
		this.setProperty(
			"terrainUnderMe",
			Terrain.getTerrainOnPosition(this.getProperty("positionAs2D").x, this.getProperty("positionAs2D").y, terrain)
		);
	}
}
