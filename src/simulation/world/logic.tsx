import { useFrame } from "@react-three/fiber";
import { ACTOR_STATE, SIMULATION_STATE, WORLD_STATE } from "../../state";
import { Terrain, WorldTerrain, MINIMUM_BORDER_DISTANCE } from "./worldGenerator";
import { Actor } from "../figures/actors/actor";
import { ActorCreatorService } from "../figures/service/actorCreatorService";
import { AnimalMatingService } from "../figures/service/animalMatingService";
import { useEffect, useState } from "react";
import { IntervalSpawnerService } from "../figures/service/intervalSpawnerService";
import { ActorFactory } from "../figures/actors/actorFactory";
import { TimeService } from "../figures/service/timeService";
import { StatisticsService } from "../figures/service/statisticsService";
import { MetadataEntity } from "../figures/entities/metadataEntity";
import _ from "lodash";
import { GlobalServices } from "../figures/service/globalServices";

export const Logic: React.FC = () => {
	const mutationRate = SIMULATION_STATE((v) => v.mutationRate);
	const mutationVariation = SIMULATION_STATE((v) => v.mutationVariation);
	const foodInterval = SIMULATION_STATE((v) => v.intervalTillFoodGeneration);
	const foodGeneratedPerInterval = SIMULATION_STATE((v) => v.foodGeneratedPerInterval);

	const [actors, setActors] = ACTOR_STATE((v) => [v.actors, v.setActors]);
	const [globalServices, setGlobalServices] = ACTOR_STATE((v) => [v.globalServices, v.setGlobalServices]);
	const terrain = WORLD_STATE((v) => v.terrain);

	const isStillActiveFilter = (v: Actor) => !v.shouldBeDeleted();

	useEffect(() => {
		const actorCreatorService = new ActorCreatorService();
		const animalMatingService = new AnimalMatingService(mutationRate, mutationVariation);
		const timeService = new TimeService();
		const statisticsService = new StatisticsService();
		const intervalSpawnerService = new IntervalSpawnerService();
		intervalSpawnerService.addSpawner(
			foodInterval,
			() => {
				return ActorFactory.getFood(globalServices, Terrain.getRandomPosition(terrain));
			},
			foodGeneratedPerInterval
		);

		intervalSpawnerService.addSpawner(
			foodInterval,
			() => {
				return ActorFactory.getSurfacePlant(
					globalServices,
					Terrain.getRandomPosition(terrain, (t) => t.type === "GRASS")
				);
			},
			foodGeneratedPerInterval
		);

		intervalSpawnerService.addSpawner(
			foodInterval,
			() => {
				return ActorFactory.getWaterPlant(
					globalServices,
					Terrain.getRandomPosition(terrain, (t) => t.type === "DEEP WATER")
				);
			},
			foodGeneratedPerInterval
		);

		globalServices.addServiceInstance(actorCreatorService);
		globalServices.getServiceInstance(ActorCreatorService);

		globalServices.addServiceInstance(animalMatingService);
		globalServices.addServiceInstance(timeService);
		globalServices.addServiceInstance(intervalSpawnerService);
		//globalServices.addServiceInstance(statisticsService);
	});

	useFrame((state, delta) => {
		const activeActors = actors.filter(isStillActiveFilter);
		const toDeleteActors = actors.filter((v) => !isStillActiveFilter(v));

		if (toDeleteActors.length !== 0) {
			//const statisticsService = globalServices.getServiceInstance(StatisticsService);
			const categoryAndReason = toDeleteActors.map((v) => {
				const metadataEntity = v.getEntityFromActor(MetadataEntity);
				const category = metadataEntity.getProperty("category");
				return {
					reason: v.deleteReason(),
					category,
				};
			});

			const groupedCategories = _.groupBy(categoryAndReason, (v) => v.category);
			const groupedCategoryReasons = Object.fromEntries(Object.entries(groupedCategories).map(([k, v]) => [k, _.groupBy(v, (l) => l.reason)]));

			/*for (const [category, reasons] of Object.entries(groupedCategoryReasons)) {
				for (const [reason, counts] of Object.entries(reasons)) {
					const count = counts.length;
					statisticsService.noteObservation(category as any, reason as any, count);
				}
			}*/
		}

		for (const actor of activeActors) {
			actor.act(
				terrain,
				activeActors.filter((v) => v !== actor),
				delta,
				globalServices
			);
		}

		globalServices.act(terrain, activeActors, delta);

		setActors([...activeActors]);

		console.log("Frame");
	});

	return <></>;
};
