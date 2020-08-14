import { Controller, Post, Body } from '@nestjs/common';
import { SignInDto } from './dto/signIn.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('/signIn')
    async signIn(@Body() signInDto: SignInDto): Promise<any> {
        return this.authService.signIn(signInDto);
    }

}