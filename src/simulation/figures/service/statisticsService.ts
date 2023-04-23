import { WorldTerrain } from "../../world/worldGenerator";
import { Actor } from "../actors/actor";
import { BaseService } from "./baseService";
import { MetadataEntity } from "../entities/metadataEntity";
import _ from "lodash";
import globalServices from "./globalServices";
import { TimeService } from "./timeService";
import { AgeEntity } from "../entities/ageEntity";

export type CauseOfDeath = {
	thirst: number;
	hunger: number;
	eaten: number;
	age: number;
};

export type Observation = {
	population: {
		prey: number;
		hunter: number;
		food: number;
	};
	averageAge: {
		prey: number;
		hunter: number;
		food: number;
	};
	causeOfDeath: {
		prey: CauseOfDeath;
		hunter: CauseOfDeath;
		food: CauseOfDeath;
	};
};

export type ObservationPoint = {
	at: number;
	observation: Observation;
};

function getEmptyObservation(): Observation {
	return {
		population: {
			prey: 0,
			hunter: 0,
			food: 0,
		},
		averageAge: {
			prey: 0,
			hunter: 0,
			food: 0,
		},
		causeOfDeath: {
			prey: { hunger: 0, thirst: 0, eaten: 0, age: 0 },
			hunter: { hunger: 0, thirst: 0, eaten: 0, age: 0 },
			food: { hunger: 0, thirst: 0, eaten: 0, age: 0 },
		},
	};
}

export class StatisticsService extends BaseService {
	private statistics: ObservationPoint[] = [];
	private sinceLastObservation = 0;

	private currentObservation: Observation = getEmptyObservation();

	constructor() {
		super("StatisticsService");
	}

	act(terrain: WorldTerrain, allActors: Actor[], delta: number): void {
		this.sinceLastObservation += delta;
		if (this.sinceLastObservation < 1) return;

		this.sinceLastObservation = 0;

		const timeService = globalServices.getServiceInstance("TimeService") as TimeService;

		const categorizedActors = allActors.map((v) => {
			const metadataEntity = v.getEntityFromActor("MetadataEntity") as MetadataEntity;
			const category = metadataEntity.getProperty("category");
			const ageEntity = v.getEntityFromActor("AgeEntity") as AgeEntity;

			return {
				category,
				age: ageEntity.getAge(),
				actor: v,
			};
		});

		const categoryCounts = _.countBy(categorizedActors, (v) => v.category);
		const groupedActorCategories = Object.fromEntries(
			Object.entries(_.groupBy(categorizedActors, (v) => v.category)).map(([k, v]) => [k, _.sumBy(v, (s) => s.age)])
		);

		const currentObservation = this.currentObservation;
		this.currentObservation = getEmptyObservation();

		currentObservation.population.food = categoryCounts["Food"] ?? 0;
		currentObservation.population.hunter = categoryCounts["Hunter"] ?? 0;
		currentObservation.population.prey = categoryCounts["Prey"] ?? 0;

		currentObservation.averageAge.food = categoryCounts["Food"] ?? 0 > 0 ? groupedActorCategories["Food"] / categoryCounts["Food"] : 0;
		currentObservation.averageAge.hunter = categoryCounts["Hunter"] ?? 0 > 0 ? groupedActorCategories["Hunter"] / categoryCounts["Hunter"] : 0;
		currentObservation.averageAge.prey = categoryCounts["Prey"] ?? 0 > 0 ? groupedActorCategories["Prey"] / categoryCounts["Prey"] : 0;

		this.statistics.push({
			at: timeService.getCurrentTime(),
			observation: currentObservation,
		});
	}

	public getObservations() {
		return _.cloneDeep(this.statistics);
	}

	public noteObservation(forWho: keyof Observation["causeOfDeath"], detail: keyof CauseOfDeath, occurrences: number) {
		this.currentObservation.causeOfDeath[forWho.toLowerCase() as keyof Observation["causeOfDeath"]][detail] += occurrences;
	}
}
