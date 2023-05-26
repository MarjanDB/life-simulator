import { Entity } from "../../../coreDecorators/className";
import { BaseEntity } from "./baseEntity";

export type Shape = "SPHERE" | "BOX";

export type ShapeEntityProperties = {
	size: number;
	shape: Shape;
};

@Entity("ShapeEntity")
export class ShapeEntity extends BaseEntity<ShapeEntityProperties> {
	constructor(size: number, shape: Shape) {
		super({ size: size, shape: shape });
	}
}
