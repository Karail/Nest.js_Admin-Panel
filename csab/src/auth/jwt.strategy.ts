import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from "passport-jwt";
import { ITokenPayload } from "./interfaces/token-payload.interface";
import { AdminsService } from "src/admins/admins.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private adminsService: AdminsService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'secret',
    });
  }
  async validate(payload: ITokenPayload) {


    const { id } = payload;
    const user = await this.adminsService.findById(id);

    if (!user) {
      throw new UnauthorizedException();
    }


    return user;
  }
}