import { Vector2 } from "three";
import { Entity } from "../../../coreDecorators/className";
import { Actor } from "../actors/actor";
import { BaseEntity } from "./baseEntity";
import { DirectionAndDistance, PositionEntity } from "./positionEntity";
import { ShapeEntity } from "./shapeEntity";
import { MetadataEntity } from "./metadataEntity";

export type ObserverEntityProperties = {
	radius: number;
	visibleToOtherCategories: boolean;
};

export type VisibleActor = {
	actor: Actor;
	position: Vector2;
} & DirectionAndDistance;

@Entity("ObserverEntity")
export class ObserverEntity extends BaseEntity<ObserverEntityProperties> {
	constructor(radius: number, visibleToOtherCategories = true, priority = 20) {
		super({ radius: radius, visibleToOtherCategories }, priority);
	}

	getAllActorDistances(allActors: Actor[]): VisibleActor[] {
		const myPosition = this.getActorInstance().getEntityFromActor(PositionEntity);

		const informationalActors = allActors.map((v) => {
			const position = v.getEntityFromActor(PositionEntity);
			const shape = v.getEntityFromActor(ShapeEntity);

			return {
				shape: shape,
				distance: myPosition.distanceToAnother(position),
				actor: v,
				position: position,
			};
		});

		const actorInfo = informationalActors.map<VisibleActor>((v) => {
			const distance = v.distance.distance;
			const direction = v.distance.direction;
			return {
				actor: v.actor,
				direction: direction,
				distance: distance,
				position: v.position.getProperty("positionAs2D").clone(),
			};
		});

		const sortedDistances = actorInfo.sort((a, b) => a.distance - b.distance);
		return sortedDistances;
	}

	getAllActorsVisibleToMe(allActors: Actor[]): VisibleActor[] {
		const myShape = this.getActorInstance().getEntityFromActor(ShapeEntity);
		const metadataEntity = this.getActorInstance().tryGetEntityFromActor(MetadataEntity);
		const myCategory = metadataEntity?.getProperty("category") ?? null;

		const actorDistances = this.getAllActorDistances(allActors);

		const informationalActors = actorDistances.map((v) => {
			const shape = v.actor.getEntityFromActor(ShapeEntity);
			const metadata = v.actor.tryGetEntityFromActor(MetadataEntity);
			const observerEntity = v.actor.tryGetEntityFromActor(ObserverEntity);
			const category = metadata?.getProperty("category") ?? null;
			const visibleToOtherCategories = observerEntity?.getProperty("visibleToOtherCategories") ?? true;

			return {
				...v,
				shape: shape,
				category: category,
				visibleToOtherCategories: visibleToOtherCategories,
			};
		});

		const allVisibleActors = informationalActors.filter((v) => {
			const sameCategories = v.category === myCategory;
			const canBeSeen = sameCategories || v.visibleToOtherCategories;
			return v.distance - myShape.getProperty("size") - v.shape.getProperty("size") < this.getProperty("radius") && canBeSeen;
		});

		const cleanDistances = allVisibleActors.map<VisibleActor>((v) => {
			return {
				actor: v.actor,
				direction: v.direction,
				distance: v.distance,
				position: v.position,
			};
		});

		return cleanDistances;
	}

	getClosestActorVisibleToMe(allActors: Actor[]) {
		const closest = this.getAllActorsVisibleToMe(allActors);
		if (closest.length === 0) return null;

		return closest[0];
	}

	getClosestActor(allActors: Actor[]) {
		const closest = this.getAllActorDistances(allActors);
		if (closest.length === 0) return null;

		return closest[0];
	}
}
