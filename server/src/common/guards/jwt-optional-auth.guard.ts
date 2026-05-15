import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtOptionalAuthGuard extends AuthGuard("jwt") {
  handleRequest(_err: unknown, user: unknown) {
    return user || null;
  }
}
