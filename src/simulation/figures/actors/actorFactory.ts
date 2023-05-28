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
import { AnimalDesires } from "../entities/animalDesires";

export class ActorFactory {
	private static assertActorIsOfCategory(category: string): ActorFilter {
		return (actor: Actor) => {
			const metadataEntity = actor.getEntityFromActor(MetadataEntity);
			return metadataEntity.getProperty("category") === category;
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

		/*const animalBehaviorEntity = new AnimalBehaviorEntity(
			sex,
			this.assertActorIsOfCategory("Food"),
			this.assertActorIsOfCategory("Prey"),
			this.assertActorIsOfCategory("Hunter")
		);*/
		const animalBehaviorEntity = new AnimalBehaviorEntity();
		const animalDesires = new AnimalDesires(
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

		/*const animalBehaviorEntity = new AnimalBehaviorEntity(
			sex,
			this.assertActorIsOfCategory("Prey"),
			this.assertActorIsOfCategory("Hunter"),
			(v) => false
		);*/
		const animalBehaviorEntity = new AnimalBehaviorEntity();
		const animalDesires = new AnimalDesires(sex, this.assertActorIsOfCategory("Prey"), this.assertActorIsOfCategory("Hunter"), () => false);

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
		]);
	}

	public static getFood(globalServices: GlobalServices, position: Vector3, size = 0.15) {
		const positionEntity = new PositionEntity(position);
		const shapeEntity = new ShapeEntity(size, "SPHERE");
		const ageEntity = new AgeEntity(15);
		const metadataEntity = new MetadataEntity({ category: "Food" });

		return new Actor(globalServices, [positionEntity, shapeEntity, ageEntity, metadataEntity]);
	}
}
