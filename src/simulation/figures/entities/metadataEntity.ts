import { Entity } from "../../../coreDecorators/className";
import { BaseEntity } from "./baseEntity";

export type MetadataEntityProperties = {
	[key: string]: string;
};

@Entity("MetadataEntity")
export class MetadataEntity extends BaseEntity<MetadataEntityProperties> {
	constructor(initialProperties: MetadataEntityProperties = {}) {
		super(initialProperties);
	}
}
