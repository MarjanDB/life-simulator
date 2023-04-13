import { Actor } from "../actors/actor";
import { BaseEntity } from "./baseEntity";
import { DirectionAndDistance, PositionEntity } from "./positionEntity";
import { ShapeEntity } from "./shapeEntity";

export type ObserverEntityProperties = {
	radius: number;
};

export type VisibleActor = {
	actor: Actor;
} & DirectionAndDistance;

export class ObserverEntity extends BaseEntity<ObserverEntityProperties> {
	constructor(radius: number) {
		super("ObserverEntity", { radius: radius });
	}

	getAllActorDistances(allActors: Actor[]): VisibleActor[] {
		const myPosition = this.getActorInstance().getEntityFromActor("PositionEntity") as PositionEntity;

		const informationalActors = allActors.map((v) => {
			const position = v.getEntityFromActor("PositionEntity") as PositionEntity;
			const shape = v.getEntityFromActor("ShapeEntity") as unknown as ShapeEntity;

			return {
				shape: shape,
				distance: myPosition.distanceToAnother(position),
				actor: v,
			};
		});

		const actorInfo = informationalActors.map<VisibleActor>((v) => {
			const distance = v.distance.distance;
			const direction = v.distance.direction;
			return {
				actor: v.actor,
				direction: direction,
				distance: distance,
			};
		});

		return actorInfo.sort((a, b) => a.distance - b.distance);
	}

	getAllActorsVisibleToMe(allActors: Actor[]): VisibleActor[] {
		const myShape = this.getActorInstance().getEntityFromActor("ShapeEntity") as unknown as ShapeEntity;

		const actorDistances = this.getAllActorDistances(allActors);

		const informationalActors = actorDistances.map((v) => {
			const shape = v.actor.getEntityFromActor("ShapeEntity") as unknown as ShapeEntity;

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
