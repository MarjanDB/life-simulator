import { Entity } from "../../../coreDecorators/className";
import { WorldTerrain } from "../../world/worldGenerator";
import { Actor } from "../actors/actor";
import { GlobalServices } from "../service/globalServices";
import { BaseEntity } from "./baseEntity";

export type Needs = {
	hunger: number;
	thirst: number;
	reproduction: number;
	energy: number;
};

export type NeedsEntityProperties = {
	needs: Needs;
	needsDeltaScaling: Needs;
	needsRegenerationScaling: Needs;
};

export type AnimalWants = "FOOD" | "WATER" | "MATE" | "REST";

const HUNGER_RATE = 0.02;
const THIRST_RATE = 0.01;
const REPRODUCTION_RATE = 0.008;
const ENERGY_DEPLETION_RATE = 0.05;

const ENERGY_REGENERATION_RATE = 0.025;

@Entity("NeedsEntity")
export class NeedsEntity extends BaseEntity<NeedsEntityProperties> {
	constructor(needsScaling?: Partial<Needs>, needsGenerationScaling?: Partial<Needs>) {
		const defaultScaling: Needs = {
			hunger: needsScaling?.hunger ?? HUNGER_RATE,
			thirst: needsScaling?.thirst ?? THIRST_RATE,
			reproduction: needsScaling?.reproduction ?? REPRODUCTION_RATE,
			energy: needsScaling?.energy ?? ENERGY_DEPLETION_RATE,
		};

		const defaultRegenerationScaling: Needs = {
			hunger: needsGenerationScaling?.hunger ?? 1,
			thirst: needsGenerationScaling?.thirst ?? 1,
			reproduction: needsGenerationScaling?.reproduction ?? 1,
			energy: needsGenerationScaling?.energy ?? ENERGY_REGENERATION_RATE,
		};

		super({
			needs: { hunger: 0, thirst: 0, reproduction: 0, energy: 0 },
			needsDeltaScaling: defaultScaling,
			needsRegenerationScaling: defaultRegenerationScaling,
		});
	}

	override act(terrain: WorldTerrain, otherActors: Actor[], delta: number, globalServices: GlobalServices) {
		const needs = this.getProperty("needs");
		const scaling = this.getProperty("needsDeltaScaling");

		needs.hunger = Math.min(1, needs.hunger + delta * scaling.hunger);
		needs.reproduction = Math.min(1, needs.reproduction + delta * scaling.reproduction);
		needs.thirst = Math.min(1, needs.thirst + delta * scaling.thirst);

		if (this.shouldDie()) {
			const reason = needs.hunger === 1 ? "hunger" : "thirst";
			this.getActorInstance().markForDeletion(reason);
		}
	}

	getOrderedNeeds(): AnimalWants[] {
		const biggestNeed = this.getProperty("needs");

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
					case "energy":
						return "REST";
				}
			});

		return orderedNeeds;
	}

	satisfyNeed(need: AnimalWants, delta: number) {
		const needs = this.getProperty("needs");

		if (need === "FOOD") needs.hunger = Math.max(0, needs.hunger - this.getProperty("needsRegenerationScaling").hunger);
		if (need === "WATER") needs.thirst = Math.max(0, needs.thirst - this.getProperty("needsRegenerationScaling").thirst);
		if (need === "MATE") needs.reproduction = Math.max(0, needs.reproduction - this.getProperty("needsRegenerationScaling").reproduction);
		if (need === "REST") needs.energy = Math.max(0, needs.energy - this.getProperty("needsRegenerationScaling").energy * delta);
	}

	shouldDie() {
		return this.getProperty("needs").thirst === 1;
	}
}
