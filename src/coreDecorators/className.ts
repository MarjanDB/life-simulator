export const nameKey = Symbol("name");

import "reflect-metadata";

export function Service(serviceName: string): ClassDecorator {
	return name(serviceName);
}

/**
 * To perserve class name though mangling.
 * @example
 * @name('Customer')
 * class Customer {}
 * @param className
 */
export function name(className: string): ClassDecorator {
	return Reflect.metadata(nameKey, className);
}

/**
 * @example
 * const type = Customer;
 * getName(type); // 'Customer'
 * @param type
 */
export function getName(type: Function): string {
	return Reflect.getMetadata(nameKey, type);
}

/**
 * @example
 * const instance = new Customer();
 * getInstanceName(instance); // 'Customer'
 * @param instance
 */
export function getInstanceName(instance: Object): string {
	return Reflect.getMetadata(nameKey, instance.constructor);
}
