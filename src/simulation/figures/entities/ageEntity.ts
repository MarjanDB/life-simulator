import { WorldTerrain } from "../../world/worldGenerator";
import { Actor } from "../actors/actor";
import { BaseEntity } from "./baseEntity";

export type AgeEntityProperties = {
	age: number;
	ageOfDeath: number | null;
	isAlive: boolean;
};

export class AgeEntity extends BaseEntity<AgeEntityProperties> {
	constructor(ageOfDeath: number | null) {
		super("AgeEntity", { age: 0, ageOfDeath: ageOfDeath, isAlive: true });
	}

	override act(terrain: WorldTerrain, otherActors: Actor[], delta: number): void {
		const currentAge = this.getProperty("age") + delta;
		this.setProperty("age", currentAge);

		const deathAt = this.getProperty("ageOfDeath");
		if (deathAt && currentAge > deathAt) {
			this.getActorInstance().markForDeletion();
		}
	}
}
