import { ActorCreatorService } from "../actorCreatorService";
import { Actor } from "../../actors/actor";
import { GlobalServices } from "../globalServices";

describe("actorCreatorService", () => {
	let globalServices: GlobalServices;
	beforeEach(() => {
		globalServices = new GlobalServices();
	});

	it("should not create actors if none were added", () => {
		const actorCreatorService = new ActorCreatorService();

		const actors: Actor[] = [];
		actorCreatorService.act([], actors, 1);
		expect(actors).toHaveLength(0);
	});

	it("should only create actors that were added to the queue", () => {
		const actorCreatorService = new ActorCreatorService();
		const testActor = new Actor(globalServices);
		const testActor2 = new Actor(globalServices);

		actorCreatorService.addActorToScene(testActor);
		actorCreatorService.addActorToScene(testActor2);
		const actors: Actor[] = [];
		actorCreatorService.act([], actors, 1);
		expect(actors).toHaveLength(2);
		expect(actors).toContain(testActor);
		expect(actors).toContain(testActor2);
	});

	it("should only create actors that were added to the queue (multiple added at once)", () => {
		const actorCreatorService = new ActorCreatorService();
		const testActor = new Actor(globalServices);
		const testActor2 = new Actor(globalServices);

		actorCreatorService.addActorsToScene([testActor, testActor2]);
		const actors: Actor[] = [];
		actorCreatorService.act([], actors, 1);
		expect(actors).toHaveLength(2);
		expect(actors).toContain(testActor);
		expect(actors).toContain(testActor2);
	});
});
