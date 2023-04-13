import { BaseEntity } from "./baseEntity";

export type Shape = "SPHERE" | "BOX";

export type ShapeEntityProperties = {
	size: number;
	shape: Shape;
};

export class ShapeEntity extends BaseEntity<ShapeEntityProperties> {
	constructor(size: number, shape: Shape) {
		super("ShapeEntity", { size: size, shape: shape });
	}
}
