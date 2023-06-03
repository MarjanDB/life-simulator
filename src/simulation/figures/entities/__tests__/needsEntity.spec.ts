import { NeedsEntity } from "../needsEntity";

describe("NeedsEntity", () => {
	let needsEntity: NeedsEntity;
	beforeEach(() => {
		needsEntity = new NeedsEntity();
	});

	it("satisfies hunger", () => {
		needsEntity.setProperty("needs", {
			hunger: 1,
			thirst: 1,
			reproduction: 1,
			energy: 1,
		});

		needsEntity.satisfyNeed("FOOD", 0.5);
		expect(needsEntity.getNeed("hunger")).toBeCloseTo(0);
	});
});
