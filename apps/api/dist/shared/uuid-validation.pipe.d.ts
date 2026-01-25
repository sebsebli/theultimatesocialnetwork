import { PipeTransform } from '@nestjs/common';
export declare class UUIDValidationPipe implements PipeTransform {
    transform(value: any): string;
}
