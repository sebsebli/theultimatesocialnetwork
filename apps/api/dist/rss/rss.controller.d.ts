import { Response } from 'express';
import { RssService } from './rss.service';
export declare class RssController {
    private readonly rssService;
    constructor(rssService: RssService);
    getRss(handle: string, res: Response): Promise<void>;
}
