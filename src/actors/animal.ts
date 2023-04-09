import { Vector2, Vector3 } from "three";
import { DirectionAndDistance, Actor, WorldTerrain, Position, Terrain, createRandomPosition } from "../world/worldGenerator";
import _ from "lodash";
import { Food } from "./food";

export type Needs = {
	hunger: number;
	thirst: number;
	reproduction: number;
};

export type AnimalSex = "MALE" | "FEMALE";
export type AnimalWants = "FOOD" | "WATER" | "MATE";
export type ClosestActor<T> = DirectionAndDistance & {
	actor: T;
};

const HUNGER_RATE = 0.01;
const THIRST_RATE = 0.005;
const REPRODUCTION_RATE = 0.01;

export class Animal extends Actor {
	private own2dPosition: Vector2 = new Vector2();
	private momentum: Vector2 = new Vector2(0, 0);
	private needs: Needs;
	public excited: boolean = false;

	constructor(position: Vector3, public detectionRadius: number, public readonly sex: AnimalSex, public speed: number, public size: number) {
		super(position, size);
		this.updatePosition(position);
		this.needs = {
			hunger: 0,
			thirst: 0,
			reproduction: 0,
		};
	}

	closestSourceOfFood(food: Food[] | Animal[]): ClosestActor<Food | Animal> | null {
		return null;
	}

	protected isActorVisibleToMe(distanceToActor: number, actor: Actor) {
		return this.size + this.detectionRadius + actor.size < distanceToActor;
	}

	protected myDistanceFrom(element: Position): DirectionAndDistance {
		const flattenPosition = new Vector2(element.position.x, element.position.y);
		const diff = flattenPosition.sub(this.own2dPosition);
		const distance = diff.length();
		const normal = diff.normalize();

		return {
			direction: normal,
			distance: distance,
		};
	}

	isDead() {
		return this.needs.thirst === 1;
	}

	getNeeds() {
		return _.clone(this.needs);
	}

	updateNeeds(multiplier: number) {
		this.needs.thirst = Math.min(1, this.needs.thirst + (THIRST_RATE + (this.needs.hunger === 1 ? HUNGER_RATE : 0)) * multiplier);
		this.needs.hunger = Math.min(1, this.needs.hunger + HUNGER_RATE * multiplier);
		this.needs.reproduction = Math.min(1, this.needs.reproduction + REPRODUCTION_RATE * multiplier);
	}

	satisfyNeed(need: AnimalWants) {
		if (need === "FOOD") this.needs.hunger = 0;
		if (need === "WATER") this.needs.thirst = 0;
		if (need === "MATE") this.needs.reproduction = 0;
	}

	updatePosition(newPosition: { x: number; y: number; z: number }) {
		this.position.set(newPosition.x, newPosition.y, newPosition.z);
		this.own2dPosition.set(newPosition.x, newPosition.y);
	}

	getPositionIn2D() {
		return this.own2dPosition.clone();
	}

	moveInDirectionBy(direction: Vector2, delta: number, world: WorldTerrain) {
		const newPosition2d = this.own2dPosition.clone().add(direction.clone().multiplyScalar(delta));

		const matchingTerrain = Terrain.getTerrainOnPosition(newPosition2d.x, newPosition2d.y, world);

		if (!matchingTerrain) return;

		this.updatePosition({ x: newPosition2d.x, y: newPosition2d.y, z: matchingTerrain.position.z });
	}

	addAccelerationIn(direction: Vector2) {
		const currentMomentumWeight = this.momentum.length();
		const addedMomentumWeight = direction.length();
		const total = currentMomentumWeight + addedMomentumWeight;
		this.momentum
			.multiplyScalar(0.5 + (0.5 * (total - currentMomentumWeight)) / total)
			.add(direction.clone().multiplyScalar(0.5 + (0.5 * (total - addedMomentumWeight)) / total))
			.clampLength(0, this.speed);
		return this.momentum.clone();
	}

	lookingFor(): AnimalWants[] {
		const biggestNeed = this.needs;

		const orderedNeeds = Object.entries(biggestNeed)
			.sort((a, b) => b[1] - a[1])
			.map(([key, val]) => key as keyof typeof biggestNeed)
			.map((v): AnimalWants => {
				switch (v) {
					case "hunger":
						return "FOOD";
					case "reproduction":
						return "MATE";
					case "thirst":
						return "WATER";
				}
			});

		return orderedNeeds;
	}

	closestSourceOfWater(world: WorldTerrain): Vector2 {
		const allWaterSources = _.flatten(world).filter((v) => v.type === "WATER");

		const allWaterSourceDistances = allWaterSources.map((v) => {
			const distanceInfo = this.myDistanceFrom(v);
			return {
				...v,
				...distanceInfo,
			};
		});

		const waterSourcesSortedByDistance = allWaterSourceDistances
			.filter((v) => v.distance <= this.detectionRadius)
			.sort((a, b) => a.distance - b.distance)
			.map((v) => v.direction);

		const closest = waterSourcesSortedByDistance[0] ?? new Vector2(0, 0); // fallback to no movement if no water source exists

		return closest;
	}

	closestMate(otherAnimals: Animal[]): ClosestActor<Animal> | null {
		const allOppositeSexAnimals = otherAnimals.filter((v) => v.sex === (this.sex === "MALE" ? "FEMALE" : "MALE"));

		if (allOppositeSexAnimals.length === 0) return null;

		const matesWithDistances = allOppositeSexAnimals
			.map((v) => {
				const distanceInfo = this.myDistanceFrom(v);
				return {
					actor: v,
					...distanceInfo,
				};
			})
			.filter((v) => v.distance <= this.detectionRadius);

		if (matesWithDistances.length === 0) return null;

		if (matesWithDistances.length === 1) return matesWithDistances[0];

		const mateDistances = matesWithDistances.map((v) => v.distance);
		const shortestDistance = Math.min(...mateDistances);
		const longestDistance = Math.max(...mateDistances);

		const mateSizes = matesWithDistances.map((v) => v.actor.size);
		const smallestMate = Math.min(...mateSizes);
		const largestMate = Math.min(...mateSizes);

		const mateScoringFunction = (mate: typeof matesWithDistances[0]) => {
			const distanceOfMate = mate.distance;
			const normalizedDistance = (distanceOfMate - shortestDistance) / (longestDistance - shortestDistance);

			const sizeOfMate = mate.actor.size;
			const normalizedSize = (sizeOfMate - smallestMate) / (largestMate - smallestMate);

			return 1 - normalizedDistance + (1 - normalizedSize);
		};

		const scoredMates = matesWithDistances.map((v) => {
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

	public static generateAnimals<T extends Animal>(
		detectionRadius: number,
		speed: number,
		size: number,
		terrain: WorldTerrain,
		numberOfAnimalsToGenerate: number = 10
	) {
		const animals = Array.from({ length: numberOfAnimalsToGenerate }).map((v) => {
			const sex: AnimalSex = Math.random() < 0.5 ? "MALE" : "FEMALE";
			const position = createRandomPosition(terrain);

			return new this(position, detectionRadius, sex, speed, size);
		});

		return animals.map((v) => new this(v.position, v.detectionRadius, v.sex, v.speed, v.size) as T);
	}

	public static generateRandomAcceleration() {
		const x = Math.random() - 0.5;
		const y = Math.random() - 0.5;
		return new Vector2(x, y).multiplyScalar(Math.random());
	}

	public static reproduceProperties<T extends Animal>(parent1: T, parent2: T, variation: number, mutationRate: number) {
		const childProperties = {
			detectionRadius: Math.random() < 0.5 ? parent1.detectionRadius : parent2.detectionRadius,
			sex: Math.random() < 0.5 ? "MALE" : ("FEMALE" as AnimalSex),
			speed: Math.random() < 0.5 ? parent1.speed : parent2.speed,
			size: Math.random() < 0.5 ? parent1.size : parent2.size,
		};

		const mutate = (value: number) => {
			const shouldMutate = Math.random() < mutationRate;
			if (!shouldMutate) return value;

			return _.random(value * (1 - variation), value * (1 + variation), true);
		};

		childProperties.detectionRadius = mutate(childProperties.detectionRadius);
		childProperties.speed = mutate(childProperties.speed);
		childProperties.size = mutate(childProperties.size);

		return childProperties;
	}
}

export class Prey extends Animal {
	override closestSourceOfFood<T extends Food>(food: T[]): ClosestActor<T> | null {
		const allFoodSources = food.map((v) => {
			const distanceInfo = this.myDistanceFrom(v);
			return {
				actor: v,
				...distanceInfo,
			};
		});

		const foodSourcesByDistance = allFoodSources.filter((v) => v.distance <= this.detectionRadius).sort((a, b) => a.distance - b.distance);

		if (foodSourcesByDistance.length === 0) return null;

		const closest = foodSourcesByDistance[0];

		closest.direction.normalize();

		return closest;
	}

	override closestMate(otherAnimals: Prey[]): ClosestActor<Prey> | null {
		return super.closestMate(otherAnimals) as any;
	}

	closestHunters(hunters: Hunter[]) {
		const allHunters = hunters.map((v) => {
			const distanceInfo = this.myDistanceFrom(v);
			return {
				actor: v,
				...distanceInfo,
			};
		});

		return allHunters.filter((v) => v.distance <= this.detectionRadius).sort((a, b) => a.distance - b.distance);
	}

	momentumFromFearOfHunters(hunters: Hunter[]) {
		const closestHunters = this.closestHunters(hunters);
		if (closestHunters.length === 0) return new Vector2(0, 0);

		const distances = closestHunters.map((v) => v.distance);
		const closest = Math.min(...distances, 5);
		const furthest = this.detectionRadius;

		const movementFear = closestHunters.reduce((p, c) => {
			const normalizedLength = 1 - (c.distance - closest) / (furthest - closest);
			return p.add(c.direction.multiplyScalar(-1 * normalizedLength * normalizedLength));
		}, new Vector2());

		movementFear.divideScalar(closestHunters.length);

		return movementFear;
	}
}

export class Hunter extends Animal {
	override closestSourceOfFood<T extends Prey>(prey: T[]): ClosestActor<T> | null {
		const allFoodSources = prey.map((v) => {
			const distanceInfo = this.myDistanceFrom(v);
			return {
				actor: v,
				...distanceInfo,
			};
		});

		const foodSourcesByDistance = allFoodSources.filter((v) => v.distance <= this.detectionRadius).sort((a, b) => a.distance - b.distance);

		if (foodSourcesByDistance.length === 0) return null;

		const closest = foodSourcesByDistance[0];
		closest.direction.normalize();

		return closest;
	}

	override closestMate(otherAnimals: Hunter[]): ClosestActor<Hunter> | null {
		return super.closestMate(otherAnimals) as any;
	}
}
