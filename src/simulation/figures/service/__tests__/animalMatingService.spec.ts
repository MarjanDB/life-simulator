import { Vector3 } from "three";
import { ActorFactory } from "../../actors/actorFactory";
import { ActorCreatorService } from "../actorCreatorService";
import { AnimalMatingService } from "../animalMatingService";
import { GlobalServices } from "../globalServices";
import { Actor } from "../../actors/actor";

describe("animalMatingService", () => {
	let globalService: GlobalServices;
	let service: AnimalMatingService;
	beforeEach(() => {
		service = new AnimalMatingService(0, 0);
		globalService = new GlobalServices();
		globalService.addServiceInstance(new ActorCreatorService());
		globalService.addServiceInstance(service);
	});

	it("should create a child when given an animal pair", () => {
		const parent1 = ActorFactory.getPrey(globalService, new Vector3(0, 0, 0), 5, "MALE", 1, 1);
		const parent2 = ActorFactory.getPrey(globalService, new Vector3(0, 0, 0), 5, "FEMALE", 1, 1);

		service.matePair(parent1, parent2);
		const actors: Actor[] = [parent1, parent2];
		globalService.act([], actors, 0.2);
		globalService.act([], actors, 0.2); // 2 passes are needed

		expect(actors).toHaveLength(3);
	});

	it("should create only 1 child when given a duplicate animal pair", () => {
		const parent1 = ActorFactory.getPrey(globalService, new Vector3(0, 0, 0), 5, "MALE", 1, 1);
		const parent2 = ActorFactory.getPrey(globalService, new Vector3(0, 0, 0), 5, "FEMALE", 1, 1);

		service.matePair(parent1, parent2);
		service.matePair(parent2, parent1);
		const actors: Actor[] = [parent1, parent2];
		globalService.act([], actors, 0.2);
		globalService.act([], actors, 0.2); // 2 passes are needed

		expect(actors).toHaveLength(3);
	});
});
