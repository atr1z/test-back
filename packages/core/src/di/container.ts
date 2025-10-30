import 'reflect-metadata';
import { container, DependencyContainer } from 'tsyringe';

/**
 * Get the global DI container instance
 */
export function getContainer(): DependencyContainer {
    return container;
}

/**
 * Register a service in the DI container
 */
export function registerService<T>(
    token: string | symbol,
    implementation: new (...args: any[]) => T
): void {
    container.register(token, { useClass: implementation });
}

/**
 * Register a singleton service in the DI container
 */
export function registerSingleton<T>(
    token: string | symbol,
    implementation: new (...args: any[]) => T
): void {
    container.registerSingleton(token, implementation);
}

/**
 * Register an instance in the DI container
 */
export function registerInstance<T>(token: string | symbol, instance: T): void {
    container.registerInstance(token, instance);
}

/**
 * Resolve a service from the DI container
 */
export function resolve<T>(
    token: string | symbol | (new (...args: any[]) => T)
): T {
    return container.resolve(token as any);
}

/**
 * Clear all registrations in the container (useful for testing)
 */
export function clearContainer(): void {
    container.clearInstances();
}

/**
 * Create a child container
 */
export function createChildContainer(): DependencyContainer {
    return container.createChildContainer();
}

export { container };
