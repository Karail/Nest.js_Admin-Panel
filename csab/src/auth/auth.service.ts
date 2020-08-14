import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { SignInDto } from './dto/signIn.dto';
import { ITokenPayload } from './interfaces/token-payload.interface';
import { AdminsService } from 'src/admins/admins.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly adminsService: AdminsService,
        private readonly jwtService: JwtService,
    ) { }

    async signIn({ email, password }: SignInDto): Promise<{ accessToken: string }> {

        const admin = await this.adminsService.findByEmail(email);
        if (admin && await bcrypt.compare(password, admin.password)) {

            const tokenPayload: ITokenPayload = {
                id: admin.id
            };
            const accessToken = await this.jwtService.sign(tokenPayload);

            return { accessToken };
        }
        throw new BadRequestException('Invalid credentials');
    }
}