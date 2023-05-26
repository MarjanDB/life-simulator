import { TimeService } from "../timeService";
import _ from "lodash";

describe("timeService", () => {
	let service: TimeService = null!;
	beforeEach(() => {
		service = new TimeService();
	});

	it("should keep track of time using delta", () => {
		const deltas = [0.1, 0.025, 0.05, 0.2];
		for (const delta of deltas) {
			service.act([], [], delta);
		}
		const currentTime = service.getCurrentTime();
		expect(currentTime).toBeCloseTo(_.sum(deltas));
	});
});
