import { Actor } from "../../actors/actor";
import { ActorCreatorService } from "../actorCreatorService";
import { GlobalServices } from "../globalServices";
import { IntervalSpawnerService } from "../intervalSpawnerService";

describe("intervalSpawnerService", () => {
	let globalService: GlobalServices = null!;
	beforeEach(() => {
		globalService = new GlobalServices();
		globalService.addServiceInstance(new ActorCreatorService());
		globalService.addServiceInstance(new IntervalSpawnerService());
	});

	it("doesn't spawn anything by default", () => {
		const actors: Actor[] = [];
		globalService.act([], actors, 1);
		expect(actors).toHaveLength(0);
	});

	it("should spawn actors on interval", () => {
		const actorGenerator = () => new Actor(globalService);
		const actors: Actor[] = [];
		const intervalSpawnerService = globalService.getServiceInstance(IntervalSpawnerService);
		intervalSpawnerService.addSpawner(1, actorGenerator, 1);

		for (let i = 0; i < 1.4; i += 0.2) {
			globalService.act([], actors, 0.2);
		}
		expect(actors).toHaveLength(1);
	});

	it("should spawn requested number of actors on interval", () => {
		const actorGenerator = () => new Actor(globalService);
		const actors: Actor[] = [];
		const intervalSpawnerService = globalService.getServiceInstance(IntervalSpawnerService);
		intervalSpawnerService.addSpawner(1, actorGenerator, 5);

		for (let i = 0; i < 1.4; i += 0.2) {
			globalService.act([], actors, 0.2);
		}
		expect(actors).toHaveLength(5);
	});
});
