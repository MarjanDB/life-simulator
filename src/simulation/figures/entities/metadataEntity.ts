import { BaseEntity } from "./baseEntity";

export type MetadataEntityProperties = {
	[key: string]: string;
};

export class MetadataEntity extends BaseEntity<MetadataEntityProperties> {
	constructor(initialProperties: MetadataEntityProperties = {}) {
		super("MetadataEntity", initialProperties);
	}
}
