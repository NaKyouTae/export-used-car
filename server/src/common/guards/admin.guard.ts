import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers["x-admin-token"];
    const adminToken = this.config.get<string>("ADMIN_TOKEN");

    if (!token || token !== adminToken) {
      throw new UnauthorizedException("Invalid admin token");
    }

    return true;
  }
}
