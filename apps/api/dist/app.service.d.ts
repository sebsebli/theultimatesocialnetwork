export declare class AppService {
    private readonly startTime;
    getInfo(): {
        name: string;
        version: string;
        uptime: number;
        environment: string;
    };
}
