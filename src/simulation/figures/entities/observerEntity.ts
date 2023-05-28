import { Vector2 } from "three";
import { Entity } from "../../../coreDecorators/className";
import { Actor } from "../actors/actor";
import { BaseEntity } from "./baseEntity";
import { DirectionAndDistance, PositionEntity } from "./positionEntity";
import { ShapeEntity } from "./shapeEntity";

export type ObserverEntityProperties = {
	radius: number;
};

export type VisibleActor = {
	actor: Actor;
	position: Vector2;
} & DirectionAndDistance;

@Entity("ObserverEntity")
export class ObserverEntity extends BaseEntity<ObserverEntityProperties> {
	constructor(radius: number, priority = 20) {
		super({ radius: radius }, priority);
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

		const actorDistances = this.getAllActorDistances(allActors);

		const informationalActors = actorDistances.map((v) => {
			const shape = v.actor.getEntityFromActor(ShapeEntity);

			return {
				...v,
				shape: shape,
			};
		});

		const allVisibleActors = informationalActors.filter((v) => {
			return v.distance - myShape.getProperty("size") - v.shape.getProperty("size") < this.getProperty("radius");
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
