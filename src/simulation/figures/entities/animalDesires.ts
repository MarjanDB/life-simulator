import { Vector2 } from "three";
import { Entity } from "../../../coreDecorators/className";
import { Terrain, WorldTerrain } from "../../world/worldGenerator";
import { Actor } from "../actors/actor";
import { GlobalServices } from "../service/globalServices";
import { BaseEntity } from "./baseEntity";
import { NeedsEntity } from "./needsEntity";
import { ObserverEntity } from "./observerEntity";
import type { VisibleActor } from "./observerEntity";
import { ShapeEntity } from "./shapeEntity";
import { PositionEntity } from "./positionEntity";
import _ from "lodash";

type BehaviorState =
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

export type AnimalEntityState = {
	sex: AnimalSex;
	currentState: BehaviorState;
	foodFilter: ActorFilter;
	kinFilter: ActorFilter;
	hunterFilter: ActorFilter;
	restFilter: TerrainFilter;
	focusedOn: Actor | null;
};

const waterSourceFilter = (v: Terrain) => v.type === "WATER" || v.type === "DEEP WATER";

@Entity("AnimalDesires")
export class AnimalDesires extends BaseEntity<AnimalEntityState> {
	constructor(sex: AnimalSex, foodFilter: ActorFilter, kinFilter: ActorFilter, hunterFilter: ActorFilter, restFilter: TerrainFilter = () => true) {
		super({ currentState: "WANDERING", sex, foodFilter, kinFilter, hunterFilter, restFilter, focusedOn: null });
	}

	act(terrain: WorldTerrain, otherActors: Actor[], delta: number, globalServices: GlobalServices): void {
		const needsEntity = this.getActorInstance().getEntityFromActor(NeedsEntity);
		const observerEntity = this.getActorInstance().getEntityFromActor(ObserverEntity);
		const shapeEntity = this.getActorInstance().getEntityFromActor(ShapeEntity);

		const food = observerEntity.getAllActorsVisibleToMe(otherActors.filter(this.getProperty("foodFilter")));
		const kin = observerEntity.getAllActorsVisibleToMe(otherActors.filter(this.getProperty("kinFilter")));
		const hunters = observerEntity.getAllActorsVisibleToMe(otherActors.filter(this.getProperty("hunterFilter")));
		const flattenTerrain = _.flatten(terrain);
		const terrainRestingArea = flattenTerrain.filter(this.getProperty("restFilter"));
		const waterSources = flattenTerrain.filter(waterSourceFilter);

		const positionEntity = this.getActorInstance().getEntityFromActor(PositionEntity);
		const myPosition = positionEntity.getProperty("positionAs2D").clone();
		const currentPositionTerrain = Terrain.getTerrainOnPosition(myPosition.x, myPosition.y, terrain);
		const currentPositionTerrainType = currentPositionTerrain.type;

		// Get future state
		const orderedNeeds = needsEntity.getOrderedNeeds();
		const currentNeed = orderedNeeds[0];

		// Early exit when animal is resting, and it's still tired
		// Or needs to rest, and can rest
		// Or is forced to rest, even when it isn't ideal
		if (
			(currentNeed === "REST" && (this.getProperty("currentState") === "RESTING" || this.getProperty("restFilter")(currentPositionTerrain))) ||
			needsEntity.getNeed("energy") === 1
		) {
			needsEntity.satisfyNeed("REST", delta);
			this.setProperty("currentState", "RESTING");
			this.setProperty("focusedOn", currentPositionTerrain);
			return;
		}

		// if animal needs rest, but clearly can't rest yet, find the best possible spot to rest at
		if (currentNeed === "REST") {
			this.setProperty("currentState", "LOOKING_FOR_REST");
			const nearestRestArea = observerEntity.getClosestActorVisibleToMe(terrainRestingArea);
			this.setProperty("focusedOn", nearestRestArea?.actor ?? null);
			return;
		}

		// If hunter is really close, ignore any other desires and just run away
		if (hunters.length !== 0 && hunters[0].distance < observerEntity.getProperty("radius") / 3) {
			this.setProperty("focusedOn", hunters[0].actor);
			this.setProperty("currentState", "FLEEING");
			return;
		}

		// if animal is thirsty, and can drink, then drink
		if (currentNeed === "WATER" && this.getProperty("currentState") === "LOOKING_FOR_WATER_CHASE" && waterSourceFilter(currentPositionTerrain)) {
			needsEntity.satisfyNeed("WATER", delta);
			this.setProperty("focusedOn", currentPositionTerrain);
			return;
		}

		// If animal is thristy, then it is looking for water
		if (currentNeed === "WATER") {
			const nearestSourceOfWater = observerEntity.getClosestActorVisibleToMe(waterSources);
			this.setProperty("currentState", nearestSourceOfWater !== null ? "LOOKING_FOR_WATER_CHASE" : "LOOKING_FOR_WATER");
			this.setProperty("focusedOn", nearestSourceOfWater?.actor ?? null);
			return;
		}

		// If animal is hungry, and can eat someone, then try to eat them
		if (currentNeed === "FOOD" && this.getProperty("currentState") === "LOOKING_FOR_FOOD_CHASE") {
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
			this.setProperty("currentState", nearestSourceOfFood === null ? "LOOKING_FOR_FOOD" : "LOOKING_FOR_FOOD_CHASE");
			this.setProperty("focusedOn", nearestSourceOfFood?.actor ?? null);
			return;
		}
	}
}
