import { Body, Controller, Get, Param, Post, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import type { ClientInfo } from "src/common/interfaces/client-info.interface";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { JwtAuthGuard } from "src/common/guard/jwt-auth.guard";
import type { Request } from "express";
import { getClientIp, getLocationFromIp } from "src/common/utils/location.util";
import { ClientInfoDecorator } from "src/common/decorators/client-info.decorator";
import { Permission } from "src/common/guard/permission.guard";

@Controller('api/v1/auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) { }

    @Post('/register')
    Register(
        @Body() dto: RegisterDto,
        @ClientInfoDecorator() client: ClientInfo
    ) {
        return this.authService.Registation(
            dto,
            client.ipAddress,
            client.userAgent
        )
    }

    @Post('/verfiy-email/:token')
    VerifyEmail(
        @Param('token') token: string,
        @ClientInfoDecorator() client: ClientInfo
    ) {
        if (!token) {
            throw new UnauthorizedException("Invalid or missing token")
        }

        return this.authService.VerifyEmail(
            token,
            client.ipAddress,
            client.userAgent
        )
    }

    @Post('/login')
    Login(
        @Body() dto: LoginDto,
        @ClientInfoDecorator() client: ClientInfo
    ) {
        return this.authService.Login(
            dto,
            client.deviceId,
            client.ipAddress,
            client.userAgent
        );
    }

    @Post('/refresh-token')
    RefreshToken(
        @Body() dto: RefreshTokenDto
    ) {
        return this.authService.refreshToken(dto.refreshToken)
    }

    @Post('/logout')
    Logout(
        @Body() dto: RefreshTokenDto
    ) {
        return this.authService.logout(
            dto.refreshToken
        )
    }

    @Post('/forget-password')
    ForgetPassword(
        @Body() dto: ForgotPasswordDto,
        @ClientInfoDecorator() client: ClientInfo
    ) {
        return this.authService.forgetPassword(
            dto,
            client.ipAddress,
            client.userAgent
        )
    }

    @Post('/reset-password/:token')
    ResetPassword(
        @Body() dto: ResetPasswordDto,
        @Param('token') token: string,
        @ClientInfoDecorator() client: ClientInfo
    ) {
        if (!token) {
            throw new UnauthorizedException("Invalid or missing token")
        }

        return this.authService.resetPassword(
            token,
            dto,
            client.ipAddress,
            client.userAgent
        )
    }

    // Permission Test

    @Get('/auth-test')
    @Permission("AUTH_TEST")
    async AuthTest () {
        return {
            success: true,
            message: "AUTH TEST"
        }
    }
}