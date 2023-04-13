import "./App.css";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Circle, MapControls, OrbitControls, Sphere, SpotLight, Text } from "@react-three/drei";
import { FormController } from "./forms/paramController";
import { SIMULATION_STATE, WORLD_STATE } from "./state";
import { Drawer } from "./simulation/world/drawer";
import { Logic } from "./simulation/world/logic";
import { Object3D, Vector3 } from "three";

Object3D.DEFAULT_UP = new Vector3(0, 0, 1);

function App() {
	const running = SIMULATION_STATE((state) => state.running);
	const worldSize = WORLD_STATE((state) => state.size);

	return (
		<div className="container mx-auto h-full max-w-5xl">
			<div className="p-5 h-full">
				<div className="grid grid-rows-4 grid-cols-2 h-full">
					<div className="bg-slate-400 row-span-3 col-span-2">
						<Canvas camera={{ position: [worldSize / 2, worldSize / 2, 15] }}>
							<MapControls />
							<ambientLight />
							<Drawer />
							{running && <Logic />}
							<directionalLight color="red" position={[worldSize, worldSize, 10]} />
							<ambientLight intensity={0.1} />
						</Canvas>
					</div>
					<div className="col-span-2 h-min bg-slate-800">
						<FormController />
					</div>
				</div>
			</div>
		</div>
	);
}

export default App;
