import { UploadService } from './upload.service';
export declare class UploadController {
    private readonly uploadService;
    constructor(uploadService: UploadService);
    uploadHeaderImage(user: {
        id: string;
    }, file: any): unknown;
    uploadProfilePicture(user: {
        id: string;
    }, file: any): unknown;
}
