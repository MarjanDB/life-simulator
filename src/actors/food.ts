import { Vector3 } from "three";
import { Actor } from "../world/worldGenerator";

const FOOD_LIFETIME = 30;

export class Food extends Actor {
	constructor(position: Vector3, size = 0.15) {
		super(position, size);
	}

	isSpoiled() {
		return this.age > FOOD_LIFETIME;
	}
}
