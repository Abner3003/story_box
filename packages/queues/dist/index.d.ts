import { Queue } from 'bullmq';
declare const connection: {
    host: string;
    port: number;
};
export declare function withLock<T>(key: string, fn: () => Promise<T>): Promise<T>;
export declare const inboundQueue: Queue<any, any, string, any, any, string>;
export declare const generationQueue: Queue<any, any, string, any, any, string>;
export declare const deliveryQueue: Queue<any, any, string, any, any, string>;
export declare const regenQueue: Queue<any, any, string, any, any, string>;
export declare const schedulerQueue: Queue<any, any, string, any, any, string>;
export { connection };
//# sourceMappingURL=index.d.ts.map