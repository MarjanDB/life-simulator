import { useFrame } from "@react-three/fiber";
import { useState } from "react";
import { Vector, Vector2 } from "three";
import { Animal, AnimalWants, Hunter, Prey } from "../actors/animal";
import { Food } from "../actors/food";
import { ACTOR_STATE, SIMULATION_STATE, WORLD_STATE } from "../state";
import { createRandomPosition, generateTerrain, Terrain, WorldTerrain } from "./worldGenerator";

const BORDER_DISTANCE = 3;

class MovementCalculator {
	length: number = 0;
	private movement: Vector2 = new Vector2(0, 0);
	constructor() {}

	public addToMovement(movement: Vector2) {
		const length = movement.length();
		this.movement.add(movement);
		this.length += length;
	}

	public setToMovement(movement: Vector2) {
		this.movement.set(movement.x, movement.y);
		this.length = this.movement.length();
	}

	public getFinalMovement() {
		return this.movement.clone().divideScalar(this.length);
	}

	public static getBorderRepulsion(terrain: WorldTerrain, currentPossition: Vector2) {
		const totalForce = new Vector2(0, 0);
		const x = currentPossition.x;
		const y = currentPossition.y;

		const closestX = Math.floor(Math.round(x / terrain.length) * terrain.length);
		const closestY = Math.floor(Math.round(y / terrain.length) * terrain.length);

		const closestBorderX = new Vector2(closestX, y);
		const closestBorderY = new Vector2(x, closestY);

		const diffX = closestBorderX.sub(currentPossition).clampLength(0, BORDER_DISTANCE);
		const diffLengthX = diffX.length();
		totalForce.add(diffX.multiplyScalar(BORDER_DISTANCE - diffLengthX).multiplyScalar(-5));

		const diffY = closestBorderY.sub(currentPossition).clampLength(0, BORDER_DISTANCE);
		const diffLengthY = diffY.length();
		totalForce.add(diffY.multiplyScalar(BORDER_DISTANCE - diffLengthY).multiplyScalar(-5));

		return totalForce;
	}
}

type AnimalActivity<T extends Animal> = {
	animal: T;
	eaten?: Animal | Food;
	mated?: T;
};

export const Logic: React.FC = () => {
	let elapsed = 0;
	const [sinceLastFoodGeneration, setSinceLastFoodGeneration] = useState(0);

	const mutationRate = SIMULATION_STATE((v) => v.mutationRate);
	const mutationVariation = SIMULATION_STATE((v) => v.mutationVariation);
	const foodInterval = SIMULATION_STATE((v) => v.intervalTillFoodGeneration);
	const foodGeneratedPerInterval = SIMULATION_STATE((v) => v.foodGeneratedPerInterval);

	const [food, setFood] = ACTOR_STATE((v) => [v.food, v.setFood]);
	const [hunters, setHunters] = ACTOR_STATE((v) => [v.hunters, v.setHunters]);
	const [prey, setPrey] = ACTOR_STATE((v) => [v.prey, v.setPrey]);
	const terrain = WORLD_STATE((v) => v.terrain);

	useFrame((state, delta) => {
		elapsed += delta;

		//if (elapsed < 0.05) return;

		const aliveHunters = hunters.filter((v) => !v.isDead());
		const alivePrey = prey.filter((v) => !v.isDead());

		const movedHunters = aliveHunters.map((v) => {
			const movementToMake = new MovementCalculator();
			movementToMake.addToMovement(Animal.generateRandomAcceleration());
			movementToMake.addToMovement(MovementCalculator.getBorderRepulsion(terrain, v.getPositionIn2D()));
			v.excited = false;

			// Figure out my biggest need
			const needs = v.lookingFor();
			let urgentMovement: Vector2 | undefined;
			for (const need of needs) {
				if (urgentMovement) break;
				switch (need) {
					case "FOOD":
						urgentMovement = v.closestSourceOfFood(prey)?.direction;
						v.excited = urgentMovement ? true : false;
						break;
					case "MATE":
						urgentMovement = v.closestMate(hunters.filter((k) => k !== v))?.direction;
						break;
					case "WATER":
						urgentMovement = v.closestSourceOfWater(terrain);
						break;
				}
			}

			if (urgentMovement) {
				movementToMake.addToMovement(urgentMovement.multiplyScalar(3));
			}

			const momentum = v.addAccelerationIn(movementToMake.getFinalMovement());
			v.moveInDirectionBy(momentum, elapsed, terrain);
			return v;
		});

		const movedPrey = alivePrey.map((v) => {
			const movementToMake = new MovementCalculator();
			movementToMake.addToMovement(Animal.generateRandomAcceleration());
			movementToMake.addToMovement(MovementCalculator.getBorderRepulsion(terrain, v.getPositionIn2D()));
			v.excited = false;

			// Figure out my biggest need
			const needs = v.lookingFor();
			let urgentMovement: Vector2 | undefined;
			for (const need of needs) {
				if (urgentMovement) break;
				switch (need) {
					case "FOOD":
						urgentMovement = v.closestSourceOfFood(food)?.direction;
						v.excited = urgentMovement ? true : false;
						break;
					case "MATE":
						urgentMovement = v.closestMate(prey.filter((k) => k !== v))?.direction;
						break;
					case "WATER":
						urgentMovement = v.closestSourceOfWater(terrain);
						break;
				}
			}

			if (urgentMovement) {
				movementToMake.addToMovement(urgentMovement);
			}

			const fear = v.momentumFromFearOfHunters(hunters);
			if (fear.length() > 0.1) {
				const final = movementToMake.getFinalMovement();
				const adjusted = fear.multiplyScalar(0.95).add(final.multiplyScalar(0.05));
				movementToMake.setToMovement(adjusted);
				movementToMake.addToMovement(MovementCalculator.getBorderRepulsion(terrain, v.getPositionIn2D()));
			}

			const momentum = v.addAccelerationIn(movementToMake.getFinalMovement());
			v.moveInDirectionBy(momentum, elapsed, terrain);
			return v;
		});

		const activeHunters = movedHunters.map((v): AnimalActivity<Hunter> => {
			const needs = v.lookingFor();
			const currentTerrain = Terrain.getTerrainOnPosition(v.position.x, v.position.y, terrain);
			let eaten: Prey | undefined;
			let mated: Hunter | undefined;

			if (!currentTerrain) throw "Could not find terrain";

			// Check most important need
			const mostImportantNeed = needs[0];

			if (mostImportantNeed === "WATER" && currentTerrain.type === "WATER") {
				v.satisfyNeed("WATER");
			}

			if (mostImportantNeed === "FOOD") {
				const closestFood = v.closestSourceOfFood(movedPrey);
				const canEat = closestFood && closestFood.distance < v.size + closestFood.actor.size;

				if (canEat) {
					v.satisfyNeed("FOOD");
					eaten = closestFood.actor;
				}
			}

			if (mostImportantNeed === "MATE") {
				const closestMate = v.closestMate(movedHunters.filter((h) => h !== v));
				const canMate = closestMate && closestMate.distance < v.size;
				if (canMate) {
					v.satisfyNeed("MATE");
					mated = closestMate.actor;
				}
			}

			return {
				animal: v,
				eaten: eaten,
				mated: mated,
			};
		});

		const reproducedHunters = activeHunters
			.filter((v) => v.mated)
			.map((v) => {
				const properties = Hunter.reproduceProperties(v.animal, v.mated!, mutationVariation, mutationRate);
				return new Hunter(v.animal.position.clone(), properties.detectionRadius, properties.sex, properties.speed, properties.size);
			});

		const eatenPrey = activeHunters.map((v) => v.eaten).filter((v) => v);
		const survivingPrey = movedPrey.filter((v) => !eatenPrey.includes(v));

		const activePrey = survivingPrey.map((v): AnimalActivity<Prey> => {
			const needs = v.lookingFor();
			const currentTerrain = Terrain.getTerrainOnPosition(v.position.x, v.position.y, terrain);
			let eaten: Food | undefined;
			let mated: Prey | undefined;

			if (!currentTerrain) throw "Could not find terrain";

			// Check most important need
			const mostImportantNeed = needs[0];

			if (mostImportantNeed === "WATER" && currentTerrain.type === "WATER") {
				v.satisfyNeed("WATER");
			}

			if (mostImportantNeed === "FOOD") {
				const closestFood = v.closestSourceOfFood(food);
				const canEat = closestFood && closestFood.distance < v.size;

				if (canEat) {
					v.satisfyNeed("FOOD");
					eaten = closestFood.actor;
				}
			}

			if (mostImportantNeed === "MATE") {
				const closestMate = v.closestMate(survivingPrey.filter((h) => h !== v));
				const canMate = closestMate && closestMate.distance < v.size;
				if (canMate) {
					v.satisfyNeed("MATE");
					mated = closestMate.actor;
				}
			}

			return {
				animal: v,
				eaten: eaten,
				mated: mated,
			};
		});

		const reproducedPrey = activePrey
			.filter((v) => v.mated)
			.map((v) => {
				const properties = Hunter.reproduceProperties(v.animal, v.mated!, mutationVariation, mutationRate);
				return new Prey(v.animal.position.clone(), properties.detectionRadius, properties.sex, properties.speed, properties.size);
			});

		const eatenFood = activePrey.map((v) => v.eaten as Food).filter((v) => v);
		const leftoverFood = food.filter((v) => !eatenFood.includes(v));

		[...activeHunters, ...activePrey].map((v) => {
			v.animal.age += elapsed;
			v.animal.updateNeeds(elapsed);
		});

		const allHunters = [...movedHunters, ...reproducedHunters];
		const allPrey = [...survivingPrey, ...reproducedPrey];

		setHunters(allHunters);
		setPrey(allPrey);

		console.log("Frame");

		let newSinceLastFoodGeneration = sinceLastFoodGeneration - elapsed;

		elapsed = 0;

		if (newSinceLastFoodGeneration < 0) {
			newSinceLastFoodGeneration = foodInterval;
			const newFood = Array.from({ length: foodGeneratedPerInterval }).map((v) => new Food(createRandomPosition(terrain)));
			leftoverFood.push(...newFood);
		}

		console.log(sinceLastFoodGeneration);

		const unspoiledFood = leftoverFood
			.map((v) => {
				v.age += elapsed;
				return v;
			})
			.filter((v) => !v.isSpoiled());

		setFood(unspoiledFood);
		setSinceLastFoodGeneration(newSinceLastFoodGeneration);
	});

	return <></>;
};
