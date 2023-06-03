import { Vector3 } from "three";
import { ActorFilter, AnimalBehaviorEntity, AnimalSex } from "../entities/animalBehaviorEntity";
import { PositionEntity } from "../entities/positionEntity";
import { ShapeEntity } from "../entities/shapeEntity";
import { AgeEntity } from "../entities/ageEntity";
import { ObserverEntity } from "../entities/observerEntity";
import { MovementEntity } from "../entities/movementEntity";
import { Actor } from "./actor";
import { MetadataEntity } from "../entities/metadataEntity";
import { NeedsEntity } from "../entities/needsEntity";
import { GlobalServices } from "../service/globalServices";
import { AnimalDesiresEntity, TerrainFilter } from "../entities/animalDesiresEntity";
import { Terrain, WorldTerrain } from "../../world/worldGenerator";
import { HeightControlEntity } from "../entities/heightControlEntity";

export class ActorFactory {
	private static assertActorIsOfCategory(category: string | string[]): ActorFilter {
		const categories = Array.isArray(category) ? category : [category];
		return (actor: Actor) => {
			const metadataEntity = actor.getEntityFromActor(MetadataEntity);
			return categories.includes(metadataEntity.getProperty("category"));
		};
	}

	public static generateMultiple(numberOfInstances: number, generatorFunction: () => Actor) {
		return Array.from({ length: numberOfInstances }).map(generatorFunction);
	}

	public static getPrey(globalServices: GlobalServices, position: Vector3, detectionRadius: number, sex: AnimalSex, speed: number, size: number) {
		const positionEntity = new PositionEntity(position);
		const shapeEntity = new ShapeEntity(size, "SPHERE");
		const ageEntity = new AgeEntity(null);
		const observerEntity = new ObserverEntity(detectionRadius);
		const movementEntity = new MovementEntity(speed);
		const metadataEntity = new MetadataEntity({ category: "Prey" });
		const needsEntity = new NeedsEntity();
		const flightEntity = new HeightControlEntity(null, 0, 1);

		const animalBehaviorEntity = new AnimalBehaviorEntity();
		const animalDesires = new AnimalDesiresEntity(
			sex,
			this.assertActorIsOfCategory("Food"),
			this.assertActorIsOfCategory("Prey"),
			this.assertActorIsOfCategory("Hunter")
		);

		return new Actor(globalServices, [
			positionEntity,
			shapeEntity,
			ageEntity,
			needsEntity,
			metadataEntity,
			observerEntity,
			movementEntity,
			animalBehaviorEntity,
			animalDesires,
			flightEntity,
		]);
	}

	public static getFish(globalServices: GlobalServices, position: Vector3, detectionRadius: number, sex: AnimalSex, speed: number, size: number) {
		const positionEntity = new PositionEntity(position);
		const shapeEntity = new ShapeEntity(size, "SPHERE");
		const ageEntity = new AgeEntity(null);
		const observerEntity = new ObserverEntity(detectionRadius);
		const movementEntity = new MovementEntity(speed);
		const metadataEntity = new MetadataEntity({ category: "Fish" });
		const needsEntity = new NeedsEntity();
		const flightEntity = new HeightControlEntity(null, 0, 1);

		const reproductionTerrain: TerrainFilter = (terrain) => terrain.type === "SAND";
		const nonWaterObstacles: TerrainFilter = (terrain) => terrain.type !== "DEEP WATER" && terrain.type !== "WATER";
		const nonWaterReproductionObstacles: TerrainFilter = (terrain) => nonWaterObstacles(terrain) && !reproductionTerrain(terrain);

		const animalBehaviorEntity = new AnimalBehaviorEntity(nonWaterObstacles);

		const animalDesires = new AnimalDesiresEntity(
			sex,
			this.assertActorIsOfCategory("WaterPlant"),
			this.assertActorIsOfCategory("Fish"),
			() => false,
			() => true,
			reproductionTerrain,
			{
				LOOKING_FOR_MATE: (actor) => animalBehaviorEntity.setProperty("barrierFilter", nonWaterReproductionObstacles),
				LOOKING_FOR_MATE_CHASE: (actor) => animalBehaviorEntity.setProperty("barrierFilter", nonWaterReproductionObstacles),
			},
			{
				LOOKING_FOR_MATE: (actor) => animalBehaviorEntity.setProperty("barrierFilter", nonWaterObstacles),
				LOOKING_FOR_MATE_CHASE: (actor) => animalBehaviorEntity.setProperty("barrierFilter", nonWaterObstacles),
			},
			{
				WATER: (actor) => {
					actor.getEntityFromActor(ObserverEntity).setProperty("visibleToOtherCategories", false);
					actor.getEntityFromActor(NeedsEntity).removeNeedScaling("thirst");
				},
				"DEEP WATER": (actor) => {
					actor.getEntityFromActor(ObserverEntity).setProperty("visibleToOtherCategories", false);
					actor.getEntityFromActor(NeedsEntity).removeNeedScaling("thirst");
				},
			},
			{
				WATER: (actor) => {
					actor.getEntityFromActor(ObserverEntity).setProperty("visibleToOtherCategories", true);
					actor.getEntityFromActor(NeedsEntity).setNeedScaling({ thirst: 0.075 });
				},
				"DEEP WATER": (actor) => {
					actor.getEntityFromActor(ObserverEntity).setProperty("visibleToOtherCategories", true),
						actor.getEntityFromActor(NeedsEntity).setNeedScaling({ thirst: 0.075 });
				},
			},
			5,
			(v) => {
				const isUnlucky = Math.random() > 0.5;
				if (!isUnlucky) return v;
				v.getEntityFromActor(AnimalBehaviorEntity).setProperty("matable", false);
				v.removeEntityFromActor(MovementEntity);
				return v;
			}
		);

		return new Actor(globalServices, [
			positionEntity,
			shapeEntity,
			ageEntity,
			needsEntity,
			metadataEntity,
			observerEntity,
			movementEntity,
			animalBehaviorEntity,
			animalDesires,
			flightEntity,
		]);
	}

	public static getHunter(globalServices: GlobalServices, position: Vector3, detectionRadius: number, sex: AnimalSex, speed: number, size: number) {
		const positionEntity = new PositionEntity(position);
		const shapeEntity = new ShapeEntity(size, "SPHERE");
		const ageEntity = new AgeEntity(null);
		const observerEntity = new ObserverEntity(detectionRadius);
		const movementEntity = new MovementEntity(speed);
		const metadataEntity = new MetadataEntity({ category: "Hunter" });
		const needsEntity = new NeedsEntity();
		const flightEntity = new HeightControlEntity(null, 0, 1);

		const animalBehaviorEntity = new AnimalBehaviorEntity();
		const animalDesires = new AnimalDesiresEntity(
			sex,
			this.assertActorIsOfCategory(["Prey", "Bird", "Fish"]),
			this.assertActorIsOfCategory("Hunter"),
			() => false
		);

		return new Actor(globalServices, [
			positionEntity,
			shapeEntity,
			ageEntity,
			needsEntity,
			metadataEntity,
			observerEntity,
			movementEntity,
			animalBehaviorEntity,
			animalDesires,
			flightEntity,
		]);
	}

	public static getBird(globalServices: GlobalServices, position: Vector3, detectionRadius: number, sex: AnimalSex, speed: number, size: number) {
		const positionEntity = new PositionEntity(position);
		const shapeEntity = new ShapeEntity(size, "SPHERE");
		const ageEntity = new AgeEntity(null);
		const observerEntity = new ObserverEntity(detectionRadius, false);
		const movementEntity = new MovementEntity(speed);
		const metadataEntity = new MetadataEntity({ category: "Bird" });
		const needsEntity = new NeedsEntity();
		const flightEntity = new HeightControlEntity(10, 10, 0.4);

		const animalBehaviorEntity = new AnimalBehaviorEntity();
		const kinFilter = this.assertActorIsOfCategory("Bird");
		const childHunterCondition = (actor: Actor) => {
			const ageEntity = actor.getEntityFromActor(AgeEntity);
			const isKin = kinFilter(actor);
			const category = actor.getEntityFromActor(MetadataEntity).getProperty("category");
			const isAnimal = category === "Hunter" || category === "Prey" || category === "Fish";
			return !isKin && ageEntity.getAge() < 25 && isAnimal;
		};

		const forestOrMountainConditional = (terarin: Terrain) => {
			return terarin.type === "FOREST" || terarin.type === "MOUNTAIN PEAK";
		};

		const landingCallback = (actor: Actor) => actor.getEntityFromActor(HeightControlEntity).setProperty("targetHeight", null);
		const deathAwareLanding = (actor: Actor, terrain: WorldTerrain) => {
			landingCallback(actor);
			const position = actor.getEntityFromActor(PositionEntity);
			const underMe = Terrain.getTerrainOnPosition(position.getProperty("positionAs2D").x, position.getProperty("positionAs2D").y, terrain);
			if (underMe.type === "DEEP WATER" || underMe.type === "WATER") actor.markForDeletion("drowning");
			if (!forestOrMountainConditional(underMe)) actor.getEntityFromActor(ObserverEntity).setProperty("visibleToOtherCategories", true);
		};
		const flyingCallback = (actor: Actor) => {
			actor.getEntityFromActor(HeightControlEntity).setProperty("targetHeight", 10);
			actor.getEntityFromActor(ObserverEntity).setProperty("visibleToOtherCategories", false);
		};

		const animalDesires = new AnimalDesiresEntity(
			sex,
			childHunterCondition,
			kinFilter,
			() => false,
			forestOrMountainConditional,
			(terrain) => terrain.type === "FOREST",
			{
				RESTING: deathAwareLanding,
				LOOKING_FOR_FOOD_CHASE: landingCallback,
				LOOKING_FOR_MATE_CHASE: landingCallback,
				LOOKING_FOR_WATER_CHASE: landingCallback,
			},
			{
				RESTING: flyingCallback,
				LOOKING_FOR_FOOD_CHASE: flyingCallback,
				LOOKING_FOR_MATE_CHASE: flyingCallback,
				LOOKING_FOR_WATER_CHASE: flyingCallback,
				WANDERING: flyingCallback,
			}
		);

		return new Actor(globalServices, [
			positionEntity,
			shapeEntity,
			ageEntity,
			needsEntity,
			metadataEntity,
			observerEntity,
			movementEntity,
			animalBehaviorEntity,
			animalDesires,
			flightEntity,
		]);
	}

	public static getFood(globalServices: GlobalServices, position: Vector3, size = 0.15) {
		const positionEntity = new PositionEntity(position);
		const shapeEntity = new ShapeEntity(size, "SPHERE");
		const ageEntity = new AgeEntity(15);
		const metadataEntity = new MetadataEntity({ category: "Food" });

		return new Actor(globalServices, [positionEntity, shapeEntity, ageEntity, metadataEntity]);
	}

	public static getWaterPlant(globalServices: GlobalServices, position: Vector3, size = 0.15) {
		const waterPlant = this.getSurfacePlant(globalServices, position, size);
		waterPlant.getEntityFromActor(MetadataEntity).setProperty("category", "WaterPlant");

		return waterPlant;
	}

	public static getSurfacePlant(globalServices: GlobalServices, position: Vector3, size = 0.15) {
		const positionEntity = new PositionEntity(position);
		const shapeEntity = new ShapeEntity(size, "SPHERE");
		const ageEntity = new AgeEntity(15);
		const metadataEntity = new MetadataEntity({ category: "SurfacePlant" });

		return new Actor(globalServices, [positionEntity, shapeEntity, ageEntity, metadataEntity]);
	}
}
