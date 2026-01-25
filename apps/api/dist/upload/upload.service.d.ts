import { ConfigService } from '@nestjs/config';
import { SafetyService } from '../safety/safety.service';
export declare class UploadService {
    private configService;
    private safetyService;
    private minioClient;
    private bucketName;
    constructor(configService: ConfigService, safetyService: SafetyService);
    uploadHeaderImage(file: any): Promise<string>;
    uploadProfilePicture(file: any): Promise<string>;
    private processAndUpload;
    getImageUrl(key: string): Promise<string>;
}
