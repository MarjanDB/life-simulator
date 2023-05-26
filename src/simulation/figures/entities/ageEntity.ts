import { WorldTerrain } from "../../world/worldGenerator";
import { Actor } from "../actors/actor";
import { GlobalServices } from "../service/globalServices";
import { BaseEntity } from "./baseEntity";

export type AgeEntityProperties = {
	age: number;
	ageOfDeath: number | null;
};

export class AgeEntity extends BaseEntity<AgeEntityProperties> {
	constructor(ageOfDeath: number | null) {
		super("AgeEntity", { age: 0, ageOfDeath: ageOfDeath });
	}

	override act(terrain: WorldTerrain, otherActors: Actor[], delta: number, globalServices: GlobalServices): void {
		const currentAge = this.getProperty("age") + delta;
		this.setProperty("age", currentAge);

		const deathAt = this.getProperty("ageOfDeath");
		if (deathAt && currentAge > deathAt) {
			this.getActorInstance().markForDeletion("age");
		}
	}

	public getAge() {
		return this.getProperty("age");
	}
}
