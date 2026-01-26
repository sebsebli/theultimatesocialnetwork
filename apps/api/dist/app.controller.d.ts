import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): {
        name: string;
        version: string;
        uptime: number;
        environment: string;
    };
    getHealth(): {
        name: string;
        version: string;
        uptime: number;
        environment: string;
        status: string;
        timestamp: string;
    };
}
