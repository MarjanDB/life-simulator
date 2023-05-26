import _ from "lodash";
import { WorldTerrain } from "../../world/worldGenerator";
import { Actor } from "../actors/actor";
import { AnimalSex } from "../entities/animalBehaviorEntity";
import { MovementEntity } from "../entities/movementEntity";
import { ObserverEntity } from "../entities/observerEntity";
import { ShapeEntity } from "../entities/shapeEntity";
import { ActorCreatorService } from "./actorCreatorService";
import { BaseService } from "./baseService";
import { MetadataEntity } from "../entities/metadataEntity";
import { ActorFactory } from "../actors/actorFactory";
import { PositionEntity } from "../entities/positionEntity";
import { Service } from "../../../coreDecorators/className";

export type Pair = {
	parent1: Actor;
	parent2: Actor;
};

@Service("AnimalMatingService")
export class AnimalMatingService extends BaseService<{ pendingPairs: Pair[] }> {
	constructor(private readonly mutationRate: number, private readonly variation: number) {
		super({
			pendingPairs: [],
		});
	}

	act(terrain: WorldTerrain, allActors: Actor[], delta: number): void {
		const pendingPairs = this.getProperty("pendingPairs");

		if (pendingPairs.length === 0) return;

		const pairsToMate: Pair[] = [];
		const duplicates = new Map<Actor, Actor>();
		for (const pair of pendingPairs) {
			const eitherExists = duplicates.get(pair.parent1) !== undefined || duplicates.get(pair.parent2) !== undefined;
			if (eitherExists) continue;

			duplicates.set(pair.parent1, pair.parent2); // was missing for test
			pairsToMate.push(pair);
		}

		if (pairsToMate.length === 0) return;

		console.log("pairs to mate:", pairsToMate);

		const actorCreatorService = this.getGlobalServices().getServiceInstance(ActorCreatorService);

		for (const pair of pairsToMate) {
			const child = this.createChildFromParents(pair.parent1, pair.parent2);
			actorCreatorService.addActorToScene(child);
		}

		this.setProperty("pendingPairs", []);
	}

	matePair(parent1: Actor, parent2: Actor) {
		this.getProperty("pendingPairs").push({
			parent1,
			parent2,
		});
	}

	protected createChildFromParents(parent1: Actor, parent2: Actor) {
		const observerEntity1 = parent1.getEntityFromActor("ObserverEntity") as ObserverEntity;
		const observerEntity2 = parent2.getEntityFromActor("ObserverEntity") as ObserverEntity;

		const movementEntity1 = parent1.getEntityFromActor("MovementEntity") as MovementEntity;
		const movementEntity2 = parent2.getEntityFromActor("MovementEntity") as MovementEntity;

		const shapeEntity1 = parent1.getEntityFromActor("ShapeEntity") as ShapeEntity;
		const shapeEntity2 = parent2.getEntityFromActor("ShapeEntity") as ShapeEntity;

		const metadataEntity = parent1.getEntityFromActor("MetadataEntity") as MetadataEntity;
		const parentsCategory = metadataEntity.getProperty("category");

		const positionEntity = parent1.getEntityFromActor("PositionEntity") as PositionEntity;

		const childProperties = {
			detectionRadius: Math.random() < 0.5 ? observerEntity1.getProperty("radius") : observerEntity2.getProperty("radius"),
			sex: Math.random() < 0.5 ? "MALE" : ("FEMALE" as AnimalSex),
			speed: Math.random() < 0.5 ? movementEntity1.getProperty("maxSpeed") : movementEntity2.getProperty("maxSpeed"),
			size: Math.random() < 0.5 ? shapeEntity1.getProperty("size") : shapeEntity2.getProperty("size"),
		};

		const mutate = (value: number) => {
			const shouldMutate = Math.random() < this.mutationRate;
			if (!shouldMutate) return value;

			return _.random(value * (1 - this.variation), value * (1 + this.variation), true);
		};

		childProperties.detectionRadius = mutate(childProperties.detectionRadius);
		childProperties.speed = mutate(childProperties.speed);
		childProperties.size = mutate(childProperties.size);

		// depending on category
		switch (parentsCategory) {
			case "Prey":
				return ActorFactory.getPrey(
					this.getGlobalServices(),
					positionEntity.getProperty("position").clone(),
					childProperties.detectionRadius,
					childProperties.sex,
					childProperties.speed,
					childProperties.size
				);

			case "Hunter":
				return ActorFactory.getHunter(
					this.getGlobalServices(),
					positionEntity.getProperty("position").clone(),
					childProperties.detectionRadius,
					childProperties.sex,
					childProperties.speed,
					childProperties.size
				);
				break;
		}

		throw "Unknown parent category";
	}
}
