import { WorldTerrain } from "../../world/worldGenerator";
import { Actor } from "../actors/actor";

export abstract class BaseService {
	constructor(public readonly name: string) {}

	abstract act(terrain: WorldTerrain, allActors: Actor[], delta: number): void;
}
