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
	needsTemporaryScaling: Partial<Needs>;
	needsOverrideScaling: Partial<Needs>;
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
			needsTemporaryScaling: {},
			needsOverrideScaling: {},
		});
	}

	override act(terrain: WorldTerrain, otherActors: Actor[], delta: number, globalServices: GlobalServices) {
		const needs = this.getProperty("needs");
		const defaultScaling = this.getProperty("needsDeltaScaling");
		const temporaryScaling = this.getProperty("needsTemporaryScaling");
		const needsOverrideScaling = this.getProperty("needsOverrideScaling");
		const scaling = { ...defaultScaling, ...needsOverrideScaling, ...temporaryScaling };

		needs.hunger = Math.min(1, needs.hunger + delta * scaling.hunger);
		needs.reproduction = Math.min(1, needs.reproduction + delta * scaling.reproduction);
		needs.thirst = Math.min(1, needs.thirst + delta * scaling.thirst);
		needs.energy = Math.min(1, needs.energy + delta * scaling.energy);

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

	getNeed(need: keyof Needs) {
		return this.getProperty("needs")[need];
	}

	setTemporaryNeedScaling(needs: Partial<Needs>) {
		const existing = this.getProperty("needsTemporaryScaling");
		this.setProperty("needsTemporaryScaling", { ...existing, ...needs });
	}

	setNeedScaling(needs: Partial<Needs>) {
		const existing = this.getProperty("needsOverrideScaling");
		this.setProperty("needsOverrideScaling", { ...existing, ...needs });
	}

	removeNeedScaling(need: keyof Needs) {
		const existing = this.getProperty("needsOverrideScaling");
		delete existing[need];
	}

	satisfyNeed(need: AnimalWants, delta: number) {
		const needs = this.getProperty("needs");

		switch (need) {
			case "FOOD":
				needs.hunger = Math.max(0, needs.hunger - this.getProperty("needsRegenerationScaling").hunger);
				this.setTemporaryNeedScaling({ hunger: 0 });
				break;
			case "MATE":
				needs.reproduction = Math.max(0, needs.reproduction - this.getProperty("needsRegenerationScaling").reproduction);
				this.setTemporaryNeedScaling({ reproduction: 0 });
				break;
			case "REST":
				needs.energy = Math.max(0, needs.energy - this.getProperty("needsRegenerationScaling").energy * delta);
				this.setTemporaryNeedScaling({ energy: 0 });
				break;
			case "WATER":
				needs.thirst = Math.max(0, needs.thirst - this.getProperty("needsRegenerationScaling").thirst);
				this.setTemporaryNeedScaling({ thirst: 0 });
				break;
		}
	}

	shouldDie() {
		return this.getProperty("needs").thirst === 1;
	}
}
