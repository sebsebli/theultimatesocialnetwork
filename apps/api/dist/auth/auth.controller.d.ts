import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { VerifyDto } from './dto/verify.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): unknown;
    verify(dto: VerifyDto): unknown;
}
