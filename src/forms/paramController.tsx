import React, { ChangeEventHandler, ReactElement, useState } from "react";
import { Terrain } from "../simulation/world/worldGenerator";
import { ACTOR_STATE, INITIAL_HUNTER_PROPERTIES, INITIAL_PREY_PROPERTIES, SIMULATION_STATE, WORLD_STATE } from "../state";
import { ActorFactory } from "../simulation/figures/actors/actorFactory";
import { StatisticsService } from "../simulation/figures/service/statisticsService";
import { json2csv } from "json-2-csv";
import { GlobalServices } from "../simulation/figures/service/globalServices";

const FormElementForNumber: React.FC<
	React.HTMLProps<HTMLInputElement> & {
		min?: number;
		max?: number;
		step?: number;
		defaultValue: number;
		propertyName: string;
		valueCallback: (value: number) => void;
	}
> = ({ min, max, step, defaultValue, valueCallback, propertyName, ...props }) => {
	const onChange: ChangeEventHandler<HTMLInputElement> = (e) => {
		const value = e.target.valueAsNumber;
		valueCallback(value);
	};

	return (
		<div {...props}>
			<label className="w-full m-1" htmlFor={propertyName}>
				{propertyName}
			</label>
			<input
				className="w-full"
				id={propertyName}
				type="number"
				min={min ?? 0}
				max={max ?? 100}
				step={step ?? 0.05}
				onBlur={onChange}
				defaultValue={defaultValue}
			></input>
		</div>
	);
};

const FormElementForString: React.FC<
	React.HTMLProps<HTMLInputElement> & {
		defaultValue: string;
		propertyName: string;
		valueCallback: (value: string) => void;
	}
> = ({ defaultValue, valueCallback, propertyName, ...props }) => {
	const onChange: ChangeEventHandler<HTMLInputElement> = (e) => {
		const value = e.target.value;
		valueCallback(value);
	};

	return (
		<div {...props}>
			<label className="w-full m-1" htmlFor={propertyName}>
				{propertyName}
			</label>
			<input className="w-full" id={propertyName} type="text" onBlur={onChange} defaultValue={defaultValue}></input>
		</div>
	);
};

async function exportRunStatistics(globalServices: GlobalServices) {
	const statisticsService = globalServices.getServiceInstance(StatisticsService);
	const statistics = statisticsService.getObservations();
	const csv = await json2csv(statistics);
	const blob = new Blob([csv], { type: "text/csv" });
	const url = URL.createObjectURL(blob);
	window.open(url);
}

export const FormController: React.FC = () => {
	const initialHunterParams = INITIAL_HUNTER_PROPERTIES();
	const initialPreyParams = INITIAL_PREY_PROPERTIES();
	const initialWorldState = WORLD_STATE();
	const initialSimulationState = SIMULATION_STATE();
	const [terrain, setTerrain] = WORLD_STATE((v) => [v.terrain, v.setTerrain]);
	const globalServices = ACTOR_STATE((v) => v.globalServices);
	const setActors = ACTOR_STATE((v) => v.setActors);

	const [temporaryHunterParams, setTemporaryHunterParams] = useState({
		detectionRadius: initialHunterParams.detectionRadius,
		speed: initialHunterParams.speed,
		size: initialHunterParams.size,
		instances: initialHunterParams.instances,
	});

	const [temporaryPreyParams, setTemporaryPreyParams] = useState({
		detectionRadius: initialPreyParams.detectionRadius,
		speed: initialPreyParams.speed,
		size: initialPreyParams.size,
		instances: initialPreyParams.instances,
	});

	const [temporaryWorldState, setTemporaryWorldState] = useState({
		seed: initialWorldState.seed,
		size: initialWorldState.size,
		resolution: initialWorldState.resolution,
	});

	const [temporarySimulationState, setTemporarySimulationState] = useState({
		mutationVariation: initialSimulationState.mutationVariation,
		mutationRate: initialSimulationState.mutationRate,
		intervalTillFoodGeneration: initialSimulationState.intervalTillFoodGeneration,
		foodGeneratedPerInterval: initialSimulationState.foodGeneratedPerInterval,
	});

	const persistStateToGlobal = () => {
		initialHunterParams.setSize(temporaryHunterParams.size);
		initialHunterParams.setSpeed(temporaryHunterParams.speed);
		initialHunterParams.setDetectionRadius(temporaryHunterParams.detectionRadius);

		initialPreyParams.setSize(temporaryPreyParams.size);
		initialPreyParams.setSpeed(temporaryPreyParams.speed);
		initialPreyParams.setDetectionRadius(temporaryPreyParams.detectionRadius);

		initialWorldState.setSeed(temporaryWorldState.seed);
		initialWorldState.setSize(temporaryWorldState.size);
		initialWorldState.setResolution(temporaryWorldState.resolution);

		initialSimulationState.setMutationRate(temporarySimulationState.mutationRate);
		initialSimulationState.setMutationVariation(temporarySimulationState.mutationVariation);
		initialSimulationState.setFoodGenerationInterval(temporarySimulationState.intervalTillFoodGeneration);
		initialSimulationState.setFoodGenerationPerInterval(temporarySimulationState.foodGeneratedPerInterval);
	};

	let index = -1;
	const createFormElement = (key: string, stateObject: any, stateCallback: React.Dispatch<React.SetStateAction<any>>) => {
		const currentValue = (stateObject[key] as number | string) ?? 0;

		const updateState = (value: number | string) => {
			const updatedStateObject = {
				...stateObject,
				[key]: value,
			};

			stateCallback(updatedStateObject);
		};

		index = index + 1;

		let element: ReactElement = null!;

		switch (typeof currentValue) {
			case "number":
				element = (
					<FormElementForNumber
						className="basis-1/4 min-w-0 bg-slate-100 border-2 border-black"
						key={index}
						defaultValue={currentValue}
						valueCallback={updateState}
						propertyName={key}
					></FormElementForNumber>
				);
				break;

			case "string":
				element = (
					<FormElementForString
						className="basis-1/4 min-w-0 bg-slate-100 border-2 border-black"
						key={index}
						defaultValue={currentValue}
						valueCallback={updateState}
						propertyName={key}
					></FormElementForString>
				);
				break;
		}

		return element;
	};

	const hunterParams = Object.keys(temporaryHunterParams).map((v) => createFormElement(v, temporaryHunterParams, setTemporaryHunterParams));
	const preyParams = Object.keys(temporaryPreyParams).map((v) => createFormElement(v, temporaryPreyParams, setTemporaryPreyParams));
	const worldParams = Object.keys(temporaryWorldState).map((v) => createFormElement(v, temporaryWorldState, setTemporaryWorldState));
	const simulationParams = Object.keys(temporarySimulationState).map((v) =>
		createFormElement(v, temporarySimulationState, setTemporarySimulationState)
	);

	const toggleRunning = () => {
		if (!initialSimulationState.running && terrain.length === 0) {
			const generatedTerrain = Terrain.generateTerrain(
				{
					seed: temporaryWorldState.seed,
					size: temporaryWorldState.size,
					resolution: temporaryWorldState.resolution,
				},
				globalServices
			);
			setTerrain(generatedTerrain);

			const prey = ActorFactory.generateMultiple(temporaryPreyParams.instances, () => {
				return ActorFactory.getPrey(
					globalServices,
					Terrain.getRandomPosition(generatedTerrain),
					temporaryPreyParams.detectionRadius,
					Math.random() < 0.5 ? "FEMALE" : "MALE",
					temporaryPreyParams.speed,
					temporaryPreyParams.size
				);
			});

			const hunters = ActorFactory.generateMultiple(temporaryHunterParams.instances, () => {
				return ActorFactory.getHunter(
					globalServices,
					Terrain.getRandomPosition(generatedTerrain),
					temporaryHunterParams.detectionRadius,
					Math.random() < 0.5 ? "FEMALE" : "MALE",
					temporaryHunterParams.speed,
					temporaryHunterParams.size
				);
			});

			const birds = ActorFactory.generateMultiple(temporaryHunterParams.instances, () => {
				return ActorFactory.getBird(
					globalServices,
					Terrain.getRandomPosition(generatedTerrain),
					temporaryHunterParams.detectionRadius,
					Math.random() < 0.5 ? "FEMALE" : "MALE",
					temporaryHunterParams.speed,
					temporaryHunterParams.size / 2
				);
			});

			const fish = ActorFactory.generateMultiple(temporaryPreyParams.instances, () => {
				return ActorFactory.getFish(
					globalServices,
					Terrain.getRandomPosition(generatedTerrain, (t) => t.type === "DEEP WATER" || t.type === "WATER"),
					temporaryPreyParams.detectionRadius,
					Math.random() < 0.5 ? "FEMALE" : "MALE",
					temporaryPreyParams.speed,
					temporaryPreyParams.size / 2
				);
			});

			console.log("creating", prey, hunters);

			setActors([...prey, ...hunters, ...birds, ...fish]);
		}

		const newRunning = !initialSimulationState.running;
		initialSimulationState.setRunning(newRunning);
		persistStateToGlobal();
	};

	return (
		<div className="flex flex-col gap-1 mx-2">
			<p className="text-blue-300 text-lg">Hunter params</p>
			<div className="flex flex-row flex-wrap">{hunterParams}</div>
			<p className="text-blue-300 text-lg">Prey params</p>
			<div className="flex flex-row flex-wrap">{preyParams}</div>
			<p className="text-blue-300 text-lg">World params</p>
			<div className="flex flex-row flex-wrap">{worldParams}</div>
			<p className="text-blue-300 text-lg">Simulation params</p>
			<div className="flex flex-row flex-wrap">{simulationParams}</div>
			<button className="bg-slate-100 m-2 mx-auto w-full" onClick={toggleRunning}>
				{initialSimulationState.running ? "Stop" : "Start"}
			</button>
			<button className="bg-slate-100 m-2 mx-auto w-full" onClick={() => exportRunStatistics(globalServices)}>
				Export Statistics
			</button>
		</div>
	);
};
