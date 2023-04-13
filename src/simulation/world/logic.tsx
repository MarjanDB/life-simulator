import { act, useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { ACTOR_STATE, SIMULATION_STATE, WORLD_STATE } from "../../state";
import { Terrain, WorldTerrain, MINIMUM_BORDER_DISTANCE } from "./worldGenerator";
import { Actor } from "../figures/actors/actor";
import { ActorCreatorService } from "../figures/service/actorCreatorService";
import { AnimalMatingService } from "../figures/service/animalMatingService";
import { useEffect } from "react";
import globalServices from "../figures/service/globalServices";
import { IntervalSpawnerService } from "../figures/service/intervalSpawnerService";
import { ActorFactory } from "../figures/actors/actorFactory";

export const Logic: React.FC = () => {
	const mutationRate = SIMULATION_STATE((v) => v.mutationRate);
	const mutationVariation = SIMULATION_STATE((v) => v.mutationVariation);
	const foodInterval = SIMULATION_STATE((v) => v.intervalTillFoodGeneration);
	const foodGeneratedPerInterval = SIMULATION_STATE((v) => v.foodGeneratedPerInterval);

	const [actors, setActors] = ACTOR_STATE((v) => [v.actors, v.setActors]);
	const terrain = WORLD_STATE((v) => v.terrain);

	const isStillActiveFilter = (v: Actor) => !v.shouldBeDeleted();

	useEffect(() => {
		const actorCreatorService = new ActorCreatorService();
		const animalMatingService = new AnimalMatingService(mutationRate, mutationVariation);
		const intervalSpawnerService = new IntervalSpawnerService();
		intervalSpawnerService.addSpawner(
			foodInterval,
			() => {
				return ActorFactory.getFood(Terrain.getRandomPosition(terrain));
			},
			foodGeneratedPerInterval
		);

		globalServices.addServiceInstance(actorCreatorService);
		globalServices.addServiceInstance(animalMatingService);
		globalServices.addServiceInstance(intervalSpawnerService);
	});

	useFrame((state, delta) => {
		const activeActors = actors.filter(isStillActiveFilter);

		for (const actor of activeActors) {
			actor.act(
				terrain,
				activeActors.filter((v) => v !== actor),
				delta
			);
		}

		globalServices.act(terrain, activeActors, delta);

		setActors([...activeActors]);

		console.log("Frame");
	});

	return <></>;
};
