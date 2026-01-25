import { ExecutionContext } from '@nestjs/common';
declare const MagicLoginGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class MagicLoginGuard extends MagicLoginGuard_base {
    getRequest(context: ExecutionContext): any;
}
export {};
