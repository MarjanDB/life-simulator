import { Entity } from "../../../coreDecorators/className";
import { Terrain, WorldTerrain } from "../../world/worldGenerator";
import { Actor } from "../actors/actor";
import { GlobalServices } from "../service/globalServices";
import { BaseEntity } from "./baseEntity";
import { PositionEntity } from "./positionEntity";

export type FlightEntityProperties = {
	targetHeight: number | null;
	currentHeight: number;
	changeDelta: number;
};

@Entity("HeightControlEntity")
export class HeightControlEntity extends BaseEntity<FlightEntityProperties> {
	constructor(targetHeight: number | null = null, startingHeight = 0, changeDelta = 0.02) {
		super({
			targetHeight: targetHeight,
			currentHeight: startingHeight,
			changeDelta: changeDelta,
		});
	}

	act(terrain: WorldTerrain, otherActors: Actor[], delta: number, globalServices: GlobalServices): void {
		const positionEntity = this.getActorInstance().getEntityFromActor(PositionEntity);
		const terrainUnderMe = Terrain.getTerrainOnPosition(
			positionEntity.getProperty("positionAs2D").x,
			positionEntity.getProperty("positionAs2D").y,
			terrain
		);
		const terrainHeight = terrainUnderMe.getEntityFromActor(PositionEntity).getProperty("position").z;

		const currentZ = positionEntity.getProperty("position").z;
		const targetHeight = this.getProperty("targetHeight");
		const lowestPossibleHeight = terrainHeight;

		const goToHeight = targetHeight ?? lowestPossibleHeight;

		const diff = goToHeight - currentZ;

		const heightDelta = diff * this.getProperty("changeDelta") * delta;
		const expectedHeight = currentZ + heightDelta;

		// take into account terrain though

		const newHeight = Math.max(expectedHeight, terrainHeight);
		positionEntity.updatePosition({ z: newHeight });
	}
}
