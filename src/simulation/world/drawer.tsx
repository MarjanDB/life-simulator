import { ACTOR_STATE, WORLD_STATE } from "../../state";
import { Box, Sphere } from "@react-three/drei";
import { WorldTerrain } from "./worldGenerator";
import _ from "lodash";
import { Vector3 } from "three";
import { PositionEntity } from "../figures/entities/positionEntity";
import { ShapeEntity } from "../figures/entities/shapeEntity";
import { Actor } from "../figures/actors/actor";
import { MetadataEntity } from "../figures/entities/metadataEntity";

const renderAsSpheres = (beings: Actor[], color: string) => {
	return beings.map((v, index) => {
		const positionEntity = v.getEntityFromActor(PositionEntity);
		const position = positionEntity.getProperty("position");

		const shapeEntity = v.getEntityFromActor(ShapeEntity);
		const size = shapeEntity.getProperty("size");

		return (
			<group key={index} position={[position.x, position.y, position.z + size]} name="Being">
				<Sphere args={[size]} position={[0, 0, 0]}>
					<meshStandardMaterial color={color} />
				</Sphere>
			</group>
		);
	});
};

const renderTerrain = (terrain: WorldTerrain) => {
	const terrainBlocks = _.flatMap(terrain);
	const offsetVector = new Vector3(0, 0, +0.5);

	const terrainGeometry = terrainBlocks.map((v, i) => {
		const positionEntity = v.getEntityFromActor(PositionEntity);
		const position = positionEntity.getProperty("position");

		return <Box key={i} args={[1, 1, 1]} position={position.clone().sub(offsetVector)} material-color={v.getMyColor()} />;
	});

	return terrainGeometry;
};

const ActiveScene: React.FC = () => {
	const actors = ACTOR_STATE((v) => v.actors);
	const categorized = actors.reduce((prev, cur) => {
		const category = cur.getEntityFromActor(MetadataEntity).getProperty("category");
		prev[category] = prev[category] ?? [];
		prev[category].push(cur);
		return prev;
	}, {} as { [key: string]: Actor[] });

	console.log(actors);

	const hunters = categorized["Hunter"] ?? [];
	const prey = categorized["Prey"] ?? [];
	const food = categorized["Food"] ?? [];
	const renderedPrey = renderAsSpheres(prey, "mediumPurple");
	const renderedHunters = renderAsSpheres(hunters, "red");
	const renderedFood = renderAsSpheres(food, "lightSalmon");

	return (
		<group name="Actors">
			<group name="Hunters">{renderedPrey}</group>
			<group name="Prey">{renderedHunters}</group>
			<group name="Food">{renderedFood}</group>
		</group>
	);
};

export const Drawer: React.FC = () => {
	const terrain = WORLD_STATE((v) => v.terrain);

	const renderedTerrain = renderTerrain(terrain);

	return (
		<group name="Scene">
			<group name="Terrain">{renderedTerrain}</group>
			<ActiveScene />
		</group>
	);
};
