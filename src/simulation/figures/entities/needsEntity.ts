import { WorldTerrain } from "../../world/worldGenerator";
import { Actor } from "../actors/actor";
import { GlobalServices } from "../service/globalServices";
import { BaseEntity } from "./baseEntity";

export type Needs = {
	hunger: number;
	thirst: number;
	reproduction: number;
};

export type NeedsEntityProperties = {
	needs: Needs;
	needsDeltaScaling: Needs;
};

export type AnimalWants = "FOOD" | "WATER" | "MATE";

const HUNGER_RATE = 0.02;
const THIRST_RATE = 0.01;
const REPRODUCTION_RATE = 0.008;

export class NeedsEntity extends BaseEntity<NeedsEntityProperties> {
	constructor(scaling?: Partial<Needs>) {
		const defaultScaling: Needs = {
			hunger: scaling?.hunger ?? HUNGER_RATE,
			thirst: scaling?.thirst ?? THIRST_RATE,
			reproduction: scaling?.reproduction ?? REPRODUCTION_RATE,
		};

		super("NeedsEntity", { needs: { hunger: 0, thirst: 0, reproduction: 0 }, needsDeltaScaling: defaultScaling });
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
				}
			});

		return orderedNeeds;
	}

	satisfyNeed(need: AnimalWants) {
		if (need === "FOOD") this.getProperty("needs").hunger = 0;
		if (need === "WATER") this.getProperty("needs").thirst = 0;
		if (need === "MATE") this.getProperty("needs").reproduction = 0;
	}

	shouldDie() {
		return this.getProperty("needs").thirst === 1;
	}
}
