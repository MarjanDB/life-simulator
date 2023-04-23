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
import globalServices from "../service/globalServices";
import { AnimalMatingService } from "../service/animalMatingService";
import { StatisticsService } from "../service/statisticsService";
import { MetadataEntity } from "./metadataEntity";

export type AnimalSex = "MALE" | "FEMALE";

export type ActorFilter = (actor: Actor) => boolean;

export type AnimalBehaviorProperties = {
	sex: AnimalSex;
	foodFilter: ActorFilter;
	kinFilter: ActorFilter;
	hunterFilter: ActorFilter;
};

export class AnimalBehaviorEntity extends BaseEntity<AnimalBehaviorProperties> {
	constructor(sex: AnimalSex, foodFilter: ActorFilter, kinFilter: ActorFilter, hunterFilter: ActorFilter) {
		super("AnimalBehaviorEntity", { sex, foodFilter, kinFilter, hunterFilter });
	}

	override act(terrain: WorldTerrain, otherActors: Actor[], delta: number): void {
		const food = otherActors.filter(this.getProperty("foodFilter"));
		const kin = otherActors.filter(this.getProperty("kinFilter"));
		const hunters = otherActors.filter(this.getProperty("hunterFilter"));

		const positionEntity = this.getActorInstance().getEntityFromActor("PositionEntity") as PositionEntity;
		const myPosition = positionEntity.getProperty("positionAs2D").clone();

		const needsEntity = this.getActorInstance().getEntityFromActor("NeedsEntity") as NeedsEntity;
		const observerEntity = this.getActorInstance().getEntityFromActor("ObserverEntity") as ObserverEntity;
		const movementEntity = this.getActorInstance().getEntityFromActor("MovementEntity") as MovementEntity;
		const shapeEntity = this.getActorInstance().getEntityFromActor("ShapeEntity") as ShapeEntity;

		const metadataEntity = this.getActorInstance().getEntityFromActor("MetadataEntity") as MetadataEntity;
		const statisticsService = globalServices.getServiceInstance("StatisticsService") as StatisticsService;
		const animalCategory = metadataEntity.getProperty("category");

		const movementCalculator = new MovementCalculator();
		const closestDeepWater = observerEntity.getClosestActor(_.flatten(terrain).filter((v) => v.type === "DEEP WATER"));

		movementCalculator.addToMovement(MovementCalculator.randomMovement(0.5));
		movementCalculator.addToMovement(MovementCalculator.getBorderRepulsion(terrain, myPosition));

		const orderedNeeds = needsEntity.getOrderedNeeds();
		let urgentMovement: Vector2 | undefined;
		const satisfiableNeed = orderedNeeds[0];
		switch (satisfiableNeed) {
			case "FOOD":
				urgentMovement = observerEntity.getClosestActorVisibleToMe(food)?.direction;
				break;
			case "MATE":
				urgentMovement = this.closestMate(kin)?.direction;
				break;
			case "WATER":
				urgentMovement = observerEntity.getClosestActorVisibleToMe(_.flatten(terrain).filter((v) => v.type === "WATER"))?.direction;
				break;
		}

		if (urgentMovement) {
			movementCalculator.addToMovement(urgentMovement.multiplyScalar(3));
		}

		const fear = this.momentumFromFearOfHunters(hunters);
		if (fear.length() > 0.1) {
			const final = movementCalculator.getFinalMovement();
			const adjusted = fear.multiplyScalar(0.95).add(final.multiplyScalar(0.05));
			movementCalculator.setToMovement(adjusted);
			movementCalculator.addToMovement(MovementCalculator.getBorderRepulsion(terrain, myPosition));
		}

		if (closestDeepWater) {
			movementCalculator.addToMovement(MovementCalculator.getDeepWaterRepulsion(closestDeepWater));
		}

		movementEntity.accelerateInDirection(movementCalculator.getFinalMovement());

		const currentTerrain = Terrain.getTerrainOnPosition(myPosition.x, myPosition.y, terrain);

		if (satisfiableNeed === "WATER" && currentTerrain.type === "WATER") {
			needsEntity.satisfyNeed("WATER");
		}

		if (satisfiableNeed === "FOOD") {
			const closestFood = observerEntity.getClosestActorVisibleToMe(food);

			const canEat =
				closestFood &&
				closestFood.distance <
					shapeEntity.getProperty("size") + (closestFood.actor.getEntityFromActor("ShapeEntity") as ShapeEntity).getProperty("size");

			if (canEat) {
				needsEntity.satisfyNeed("FOOD");
				closestFood.actor.markForDeletion("eaten");
			}
		}

		if (satisfiableNeed === "MATE") {
			const closestMate = this.closestMate(kin);
			const canMate =
				closestMate &&
				closestMate.distance <
					shapeEntity.getProperty("size") + (closestMate.actor.getEntityFromActor("ShapeEntity") as ShapeEntity).getProperty("size");

			if (canMate) {
				needsEntity.satisfyNeed("MATE");
				const animalMatingService = globalServices.getServiceInstance("AnimalMatingService") as AnimalMatingService;
				animalMatingService.matePair(this.getActorInstance(), closestMate.actor);
			}
		}
	}

	protected momentumFromFearOfHunters(hunters: Actor[]) {
		const observerEntity = this.getActorInstance().getEntityFromActor("ObserverEntity") as ObserverEntity;

		const closestHunters = observerEntity.getAllActorsVisibleToMe(hunters);
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

	protected closestMate(otherAnimals: Actor[]): VisibleActor | null {
		const mySex = this.getProperty("sex");
		const allOppositeSexAnimals = otherAnimals.filter((v) => {
			const behaviorEntity = v.getEntityFromActor("AnimalBehaviorEntity") as AnimalBehaviorEntity;
			return behaviorEntity.getProperty("sex") === (mySex === "MALE" ? "FEMALE" : "MALE");
		});

		if (allOppositeSexAnimals.length === 0) return null;

		const myObservableRadius = this.getActorInstance().getEntityFromActor("ObserverEntity") as ObserverEntity;

		const matesWithDistances = myObservableRadius.getAllActorsVisibleToMe(allOppositeSexAnimals);

		if (matesWithDistances.length === 0) return null;

		if (matesWithDistances.length === 1) return matesWithDistances[0];

		const matesWithSizes = matesWithDistances.map((v) => {
			const shapeEntity = v.actor.getEntityFromActor("ShapeEntity") as ShapeEntity;

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
