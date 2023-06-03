import { Vector2 } from "three";
import { Entity } from "../../../coreDecorators/className";
import { Terrain, TerrainType, WorldTerrain } from "../../world/worldGenerator";
import { Actor } from "../actors/actor";
import { GlobalServices } from "../service/globalServices";
import { BaseEntity } from "./baseEntity";
import { NeedsEntity } from "./needsEntity";
import { ObserverEntity } from "./observerEntity";
import type { VisibleActor } from "./observerEntity";
import { ShapeEntity } from "./shapeEntity";
import { PositionEntity } from "./positionEntity";
import _ from "lodash";
import { AnimalMatingService } from "../service/animalMatingService";
import { HeightControlEntity } from "./heightControlEntity";
import { AnimalBehaviorEntity } from "./animalBehaviorEntity";

export type BehaviorState =
	| "WANDERING"
	| "FLEEING"
	| "RESTING"
	| "LOOKING_FOR_FOOD"
	| "LOOKING_FOR_MATE"
	| "LOOKING_FOR_REST"
	| "LOOKING_FOR_WATER"
	| "LOOKING_FOR_FOOD_CHASE"
	| "LOOKING_FOR_MATE_CHASE"
	| "LOOKING_FOR_WATER_CHASE";

export type AnimalSex = "MALE" | "FEMALE";
export type ActorFilter = (actor: Actor) => boolean;
export type TerrainFilter = (actor: Terrain) => boolean;

export type StateChangeListeners = {
	[key in BehaviorState]?: (actor: Actor, terrain: WorldTerrain) => void;
};

export type TerrainChangeListeners = {
	[key in TerrainType]?: (actor: Actor, terrain: WorldTerrain) => void;
};

export type AnimalEntityState = {
	sex: AnimalSex;
	currentState: BehaviorState;
	foodFilter: ActorFilter;
	kinFilter: ActorFilter;
	hunterFilter: ActorFilter;
	restFilter: TerrainFilter;
	reproductionTerrainFilter: TerrainFilter;
	focusedOn: Actor | null;
	onStateEntered: StateChangeListeners;
	onStateLeft: StateChangeListeners;
	onTerrainEntered: TerrainChangeListeners;
	onTerrainLeft: TerrainChangeListeners;
	numberOfOffspring: number;
	offspringGenerationAdjustment: (actor: Actor) => Actor;
};

const waterSourceFilter = (v: Terrain) => v.type === "WATER" || v.type === "DEEP WATER";

@Entity("AnimalDesires")
export class AnimalDesiresEntity extends BaseEntity<AnimalEntityState> {
	constructor(
		sex: AnimalSex,
		foodFilter: ActorFilter,
		kinFilter: ActorFilter,
		hunterFilter: ActorFilter,
		restFilter = (terrain: Terrain) => true,
		reproductionTerrainFilter = (terrain: Terrain) => true,
		onStateEntered: StateChangeListeners = {},
		onStateLeft: StateChangeListeners = {},
		onTerrainEntered: TerrainChangeListeners = {},
		onTerrainLeft: TerrainChangeListeners = {},
		numberOfOffspring = 1,
		offspringGenerationAdjustment = (v: Actor) => v
	) {
		super({
			currentState: "WANDERING",
			sex,
			foodFilter,
			kinFilter,
			hunterFilter,
			reproductionTerrainFilter,
			restFilter,
			focusedOn: null,
			onStateEntered,
			onStateLeft,
			onTerrainEntered,
			onTerrainLeft,
			numberOfOffspring,
			offspringGenerationAdjustment,
		});
	}

	protected changeState(newState: BehaviorState, terrain: WorldTerrain) {
		const currentstate = this.getProperty("currentState");
		if (currentstate === newState) return;

		const onStateLeft = this.getProperty("onStateLeft");
		const onStateEntered = this.getProperty("onStateEntered");
		const onLeftCallback = onStateLeft[currentstate];
		const onEnteredCallback = onStateEntered[newState];

		if (onLeftCallback) {
			onLeftCallback(this.getActorInstance(), terrain);
		}
		this.setProperty("currentState", newState);

		if (onEnteredCallback) {
			onEnteredCallback(this.getActorInstance(), terrain);
		}
	}

	protected changeLastTerrain(newState: TerrainType, terrain: WorldTerrain) {
		if (this.lastTerrain === newState) return;

		const onStateLeft = this.getProperty("onTerrainLeft");
		const onStateEntered = this.getProperty("onTerrainEntered");
		const onLeftCallback = onStateLeft[this.lastTerrain];
		const onEnteredCallback = onStateEntered[newState];

		if (onLeftCallback) {
			onLeftCallback(this.getActorInstance(), terrain);
		}
		this.lastTerrain = newState;

		if (onEnteredCallback) {
			onEnteredCallback(this.getActorInstance(), terrain);
		}
	}

	protected lastTerrain: TerrainType = "BORDER";

	act(terrain: WorldTerrain, otherActors: Actor[], delta: number, globalServices: GlobalServices): void {
		const needsEntity = this.getActorInstance().getEntityFromActor(NeedsEntity);
		const observerEntity = this.getActorInstance().getEntityFromActor(ObserverEntity);
		const heightControlEntity = this.getActorInstance().getEntityFromActor(HeightControlEntity);

		const food = observerEntity.getAllActorsVisibleToMe(otherActors.filter(this.getProperty("foodFilter")));
		const kin = observerEntity.getAllActorsVisibleToMe(otherActors.filter(this.getProperty("kinFilter")));
		const hunters = observerEntity.getAllActorsVisibleToMe(otherActors.filter(this.getProperty("hunterFilter")));
		const flattenTerrain = _.flatten(terrain);
		const terrainRestingArea = flattenTerrain.filter(this.getProperty("restFilter"));
		const reproductionTerrain = flattenTerrain.filter(this.getProperty("reproductionTerrainFilter"));
		const waterSources = flattenTerrain.filter(waterSourceFilter);

		const positionEntity = this.getActorInstance().getEntityFromActor(PositionEntity);
		const myPosition = positionEntity.getProperty("positionAs2D").clone();
		const currentPositionTerrain = Terrain.getTerrainOnPosition(myPosition.x, myPosition.y, terrain);

		this.changeLastTerrain(currentPositionTerrain.type, terrain);

		// Things to do for current state
		const currentState = this.getProperty("currentState");

		// Get future state
		const orderedNeeds = needsEntity.getOrderedNeeds();
		const currentNeed = orderedNeeds[0];

		// Early exit when animal is resting, and it's still tired
		// Or needs to rest, and can rest
		// Or is forced to rest, even when it isn't ideal
		if (
			(currentNeed === "REST" && (currentState === "RESTING" || this.getProperty("restFilter")(currentPositionTerrain))) ||
			needsEntity.getNeed("energy") === 1
		) {
			needsEntity.satisfyNeed("REST", delta);
			heightControlEntity.setProperty("targetHeight", null);
			this.changeState("RESTING", terrain);
			this.setProperty("focusedOn", currentPositionTerrain);
			return;
		}

		// if animal needs rest, but clearly can't rest yet, find the best possible spot to rest at
		if (currentNeed === "REST") {
			this.changeState("LOOKING_FOR_REST", terrain);
			const nearestRestArea = observerEntity.getClosestActorVisibleToMe(terrainRestingArea);
			this.setProperty("focusedOn", nearestRestArea?.actor ?? null);
			return;
		}

		// If hunter is really close, ignore any other desires and just run away
		if (hunters.length !== 0 && hunters[0].distance < observerEntity.getProperty("radius") / 3) {
			this.setProperty("focusedOn", hunters[0].actor);
			this.changeState("FLEEING", terrain);
			return;
		}

		// if animal is thirsty, and can drink, then drink
		if (currentNeed === "WATER" && currentState === "LOOKING_FOR_WATER_CHASE" && waterSourceFilter(currentPositionTerrain)) {
			needsEntity.satisfyNeed("WATER", delta);
			this.setProperty("focusedOn", currentPositionTerrain);
			return;
		}

		// If animal is thristy, then it is looking for water
		if (currentNeed === "WATER") {
			const nearestSourceOfWater = observerEntity.getClosestActorVisibleToMe(waterSources);
			this.changeState(nearestSourceOfWater !== null ? "LOOKING_FOR_WATER_CHASE" : "LOOKING_FOR_WATER", terrain);
			this.setProperty("focusedOn", nearestSourceOfWater?.actor ?? null);
			return;
		}

		// If animal is hungry, and can eat someone, then try to eat them
		if (currentNeed === "FOOD" && currentState === "LOOKING_FOR_FOOD_CHASE") {
			const closestFoodSource = food.at(0) ?? null; // Possible future bug? undefined
			this.setProperty("focusedOn", closestFoodSource?.actor ?? null);
			const canEatClosestFoodSource = closestFoodSource && positionEntity.isTouchingActor(closestFoodSource.actor);
			if (canEatClosestFoodSource) {
				needsEntity.satisfyNeed("FOOD", delta);
				closestFoodSource.actor.markForDeletion("eaten");
			}
			return;
		}

		// if animal is hungry, try to find someone to eat
		if (currentNeed === "FOOD") {
			const nearestSourceOfFood = food.at(0) ?? null;
			this.changeState(nearestSourceOfFood === null ? "LOOKING_FOR_FOOD" : "LOOKING_FOR_FOOD_CHASE", terrain);
			this.setProperty("focusedOn", nearestSourceOfFood?.actor ?? null);
			return;
		}

		if (
			currentNeed === "MATE" &&
			currentState === "LOOKING_FOR_MATE_CHASE" &&
			this.getProperty("reproductionTerrainFilter")(currentPositionTerrain)
		) {
			const bestCloseMate = this.closestMate(kin);
			this.changeState(bestCloseMate === null ? "LOOKING_FOR_MATE" : "LOOKING_FOR_MATE_CHASE", terrain);
			this.setProperty("focusedOn", bestCloseMate?.actor ?? null);
			const canMate = bestCloseMate && positionEntity.isTouchingActor(bestCloseMate.actor);
			if (canMate) {
				needsEntity.satisfyNeed("MATE", delta);
				const animalMatingService = this.getActorInstance().getGlobalServices().getServiceInstance(AnimalMatingService);
				animalMatingService.matePair(
					this.getActorInstance(),
					bestCloseMate.actor,
					this.getProperty("numberOfOffspring"),
					this.getProperty("offspringGenerationAdjustment")
				);
			}
			return;
		}

		if (currentNeed === "MATE" && !this.getProperty("reproductionTerrainFilter")(currentPositionTerrain)) {
			const nearestMatingTerrain = observerEntity.getClosestActorVisibleToMe(reproductionTerrain);
			const kinOnTerrain = kin.filter((v) =>
				this.getProperty("reproductionTerrainFilter")(
					Terrain.getTerrainOnEntityPosition(v.actor.getEntityFromActor(PositionEntity).getProperty("positionAs2D"), terrain)
				)
			);
			const nearestKinOnMatingTerrain = this.closestMate(kinOnTerrain);
			this.changeState(nearestKinOnMatingTerrain ? "LOOKING_FOR_MATE_CHASE" : "LOOKING_FOR_MATE", terrain);
			const closestMatch = nearestKinOnMatingTerrain ?? nearestMatingTerrain;
			this.setProperty("focusedOn", closestMatch?.actor ?? null);
			return;
		}

		if (currentNeed === "MATE") {
			const bestCloseMate = this.closestMate(kin);
			this.changeState(bestCloseMate === null ? "LOOKING_FOR_MATE" : "LOOKING_FOR_MATE_CHASE", terrain);
			this.setProperty("focusedOn", bestCloseMate?.actor ?? null);
			return;
		}

		this.changeState("WANDERING", terrain);
	}

	protected closestMate(otherAnimals: VisibleActor[]): VisibleActor | null {
		const mySex = this.getProperty("sex");
		const allOppositeSexAnimals = otherAnimals.filter((v) => {
			const desiresEntity = v.actor.getEntityFromActor(AnimalDesiresEntity);
			const behaviorEntity = v.actor.getEntityFromActor(AnimalBehaviorEntity);
			return desiresEntity.getProperty("sex") === (mySex === "MALE" ? "FEMALE" : "MALE") && behaviorEntity.getProperty("matable");
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
