import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    create(user: {
        id: string;
    }, dto: CreateReportDto): unknown;
}
