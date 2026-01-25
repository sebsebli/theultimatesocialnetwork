import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { VerifyDto } from './dto/verify.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        success: boolean;
        message: string;
    }>;
    verify(dto: VerifyDto): Promise<{
        accessToken: any;
        user: {
            id: string;
            email: string;
            handle: string;
            displayName: string;
        };
    }>;
}
