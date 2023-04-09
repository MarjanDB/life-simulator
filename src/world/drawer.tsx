import { ACTOR_STATE, SIMULATION_STATE, WORLD_STATE } from "../state";
import { Box, Circle, OrbitControls, Sphere, Text } from "@react-three/drei";
import { Animal } from "../actors/animal";
import { Food } from "../actors/food";
import { WorldTerrain } from "./worldGenerator";
import _ from "lodash";
import { Vector3 } from "three";

const convertToAnimalSphere = (beings: Animal[], color: string) => {
	return beings.map((v, index) => {
		return (
			<group key={index} position={[v.position.x, v.position.y, v.position.z + v.size]} name="Being">
				<Sphere args={[v.size]} position={[0, 0, 0]}>
					<meshStandardMaterial color={color} />
				</Sphere>
				{v.excited && (
					<Sphere args={[v.size * 1.25]} position={[0, 0, 0]}>
						<meshStandardMaterial color="white" transparent opacity={0.3} />
					</Sphere>
				)}
			</group>
		);
	});
};

const convertToSphere = (beings: Food[], color: string) => {
	return beings.map((v, index) => {
		return (
			<group key={index} position={[v.position.x, v.position.y, v.position.z + v.size]} name="Being">
				<Sphere args={[v.size]} position={[0, 0, 0]}>
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
		return <Box key={i} args={[1, 1, 1]} position={v.position.clone().sub(offsetVector)} material-color={v.getMyColor()} />;
	});

	return terrainGeometry;
};

const ActiveScene: React.FC = () => {
	const hunters = ACTOR_STATE((v) => v.hunters);
	const prey = ACTOR_STATE((v) => v.prey);
	const food = ACTOR_STATE((v) => v.food);
	const renderedPrey = convertToAnimalSphere(prey, "mediumPurple");
	const renderedHunters = convertToAnimalSphere(hunters, "red");
	const renderedFood = convertToSphere(food, "lightSalmon");

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
