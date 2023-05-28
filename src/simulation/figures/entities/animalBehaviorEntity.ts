import { Vector2 } from "three";
import MovementCalculator from "../../logic/movementCalculator";
import { Terrain, WorldTerrain } from "../../world/worldGenerator";
import { Actor } from "../actors/actor";
import { BaseEntity } from "./baseEntity";
import { NeedsEntity } from "./needsEntity";
import { PositionEntity } from "./positionEntity";
import { ObserverEntity, VisibleActor } from "./observerEntity";
import _ from "lodash";
import { MovementEntity } from "./movementEntity";
import { ShapeEntity } from "./shapeEntity";
import { AnimalMatingService } from "../service/animalMatingService";
import { StatisticsService } from "../service/statisticsService";
import { MetadataEntity } from "./metadataEntity";
import { GlobalServices } from "../service/globalServices";
import { Entity } from "../../../coreDecorators/className";
import { AnimalDesires } from "./animalDesires";

export type AnimalSex = "MALE" | "FEMALE";

export type ActorFilter = (actor: Actor) => boolean;
export type TerrainFilter = (actor: Terrain) => boolean;
export type BehaviorCondition = (actor: Actor) => boolean;

export type AnimalBehaviorProperties = {
	barrierFilter: TerrainFilter;
};

@Entity("AnimalBehaviorEntity")
export class AnimalBehaviorEntity extends BaseEntity<AnimalBehaviorProperties> {
	constructor(barrierFilter: TerrainFilter = (terrain) => terrain.type === "DEEP WATER" || terrain.type === "BORDER") {
		super({ barrierFilter });
	}

	override act(terrain: WorldTerrain, otherActors: Actor[], delta: number, globalServices: GlobalServices): void {
		const movementEntity = this.getActorInstance().getEntityFromActor(MovementEntity);
		const desiresEntity = this.getActorInstance().getEntityFromActor(AnimalDesires);
		const observerEntity = this.getActorInstance().getEntityFromActor(ObserverEntity);

		const flattenTerrain = _.flatten(terrain);
		const terrainBarriers = flattenTerrain.filter(this.getProperty("barrierFilter"));

		const positionEntity = this.getActorInstance().getEntityFromActor(PositionEntity);
		const myPosition = positionEntity.getProperty("positionAs2D").clone();

		if (desiresEntity.getProperty("currentState") === "RESTING") {
			movementEntity.dampMovement(0);
			return;
		}

		const movementCalculator = new MovementCalculator();

		movementCalculator.addToMovement(MovementCalculator.randomMovement(0.5));

		const movementDesire = desiresEntity.getProperty("focusedOn")?.getEntityFromActor(PositionEntity);
		if (movementDesire) {
			const direction = positionEntity.distanceToAnother(movementDesire);
			const maxObservationDistance = observerEntity.getProperty("radius");
			const inverseSpeedBasedOnDistance = (maxObservationDistance - direction.distance) / maxObservationDistance;
			const movementToAdd = direction.direction.multiplyScalar(inverseSpeedBasedOnDistance);
			if (desiresEntity.getProperty("currentState") === "FLEEING") movementToAdd.multiplyScalar(-1);
			movementCalculator.addToMovement(movementToAdd);
		}

		/*const fear = this.momentumFromFearOfHunters(hunters);
		if (fear.length() > 0.1) {
			const final = movementCalculator.getFinalMovement();
			const adjusted = fear.multiplyScalar(0.95).add(final.multiplyScalar(0.05));
			movementCalculator.setToMovement(adjusted);
		}*/

		const wantedMovement = movementCalculator.getFinalMovement();
		movementEntity.accelerateInDirection(wantedMovement);
		const nextMovement = movementEntity.getProperty("momentum");
		const modifiedMovement = MovementCalculator.applyBarrierRepulsionMultiplier(myPosition, nextMovement, terrainBarriers);
		movementEntity.setProperty("momentum", modifiedMovement);

		/*
		if (satisfiableNeed === "MATE") {
			const closestMate = this.closestMate(kin);
			const canMate =
				closestMate &&
				closestMate.distance < shapeEntity.getProperty("size") + closestMate.actor.getEntityFromActor(ShapeEntity).getProperty("size");

			if (canMate) {
				needsEntity.satisfyNeed("MATE", delta);
				const animalMatingService = globalServices.getServiceInstance(AnimalMatingService);
				animalMatingService.matePair(this.getActorInstance(), closestMate.actor);
			}
		}*/
	}

	protected momentumFromFearOfHunters(closestHunters: VisibleActor[]) {
		const observerEntity = this.getActorInstance().getEntityFromActor(ObserverEntity);
		if (closestHunters.length === 0) return new Vector2(0, 0);

		const distances = closestHunters.map((v) => v.distance);
		const closest = Math.min(...distances, 5);
		const furthest = observerEntity.getProperty("radius");

		const movementFear = closestHunters.reduce((p, c) => {
			const normalizedLength = 1 - (c.distance - closest) / (furthest - closest);
			return p.add(c.direction.multiplyScalar(-1 * normalizedLength * normalizedLength));
		}, new Vector2());

		movementFear.divideScalar(closestHunters.length);

		return movementFear;
	}

	protected closestMate(otherAnimals: VisibleActor[]): VisibleActor | null {
		const mySex = this.getProperty("sex");
		const allOppositeSexAnimals = otherAnimals.filter((v) => {
			const behaviorEntity = v.actor.getEntityFromActor(AnimalBehaviorEntity);
			return behaviorEntity.getProperty("sex") === (mySex === "MALE" ? "FEMALE" : "MALE");
		});

		if (allOppositeSexAnimals.length === 0) return null;

		const matesWithDistances = allOppositeSexAnimals;

		if (matesWithDistances.length === 0) return null;

		if (matesWithDistances.length === 1) return matesWithDistances[0];

		const matesWithSizes = matesWithDistances.map((v) => {
			const shapeEntity = v.actor.getEntityFromActor(ShapeEntity);

			return {
				...v,
				size: shapeEntity.getProperty("size"),
			};
		});

		const mateDistances = matesWithSizes.map((v) => v.distance);
		const shortestDistance = Math.min(...mateDistances);
		const longestDistance = Math.max(...mateDistances);

		const mateSizes = matesWithSizes.map((v) => v.size);
		const smallestMate = Math.min(...mateSizes);
		const largestMate = Math.min(...mateSizes);

		const mateScoringFunction = (mate: (typeof matesWithSizes)[0]) => {
			const distanceOfMate = mate.distance;
			const normalizedDistance = (distanceOfMate - shortestDistance) / (longestDistance - shortestDistance);

			const sizeOfMate = mate.size;
			const normalizedSize = (sizeOfMate - smallestMate) / (largestMate - smallestMate);

			return 1 - normalizedDistance + (1 - normalizedSize);
		};

		const scoredMates = matesWithSizes.map((v) => {
			const scored = mateScoringFunction(v);

			return {
				...v,
				mateScore: scored,
			};
		});

		const sortedScoredMates = scoredMates.sort((a, b) => a.mateScore - b.mateScore);

		const bestMate = sortedScoredMates[0];

		return bestMate;
	}
}
