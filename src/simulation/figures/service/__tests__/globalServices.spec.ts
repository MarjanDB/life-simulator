import { BaseService } from "../baseService";
import { GlobalServices } from "../globalServices";

describe("globalServices", () => {
	let service: GlobalServices = null!;
	beforeEach(() => {
		service = new GlobalServices();
	});

	it("should accept BaseService instances", () => {
		const baseService = new GlobalServices();
		service.addServiceInstance(baseService);
		const serviceInstance = service.getServiceInstance(GlobalServices);
		expect(serviceInstance).toEqual(baseService);
	});
});
