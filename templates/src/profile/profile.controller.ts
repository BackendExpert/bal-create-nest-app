import { Body, Controller, Get, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { ProfileService } from "./profile.service";
import { JwtAuthGuard } from "src/common/guard/jwt-auth.guard";
import { Permission, PermissionGuard } from "src/common/guard/permission.guard";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "src/common/interfaces/authenticated-user.interface";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { getClientIp, getLocationFromIp } from "src/common/utils/location.util";
import type { Request } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { profileImageUploadOptions } from "src/common/utils/file-upload.util";
import { UpdatePasswordDTO } from "./dto/update-password.dto";

@Controller('api/v1/profile')
export class ProfileController {
    constructor(
        private readonly profileService: ProfileService
    ) { }

    @Get('/my-profile')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @Permission('FETCH_MY_PROFILE')
    FetchMyProfile(
        @CurrentUser() user: AuthenticatedUser
    ) {
        return this.profileService.FetchMyProfile(user)
    }

    @Patch('/update-my-profile')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @Permission('UPDATE_PROFILE')
    @UseInterceptors(FileInterceptor('profileImage', profileImageUploadOptions))
    async UpdateProfile(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: UpdateProfileDto,
        @UploadedFile() profileImage: any,
        @Req() req: Request,
    ) {
        const ipAddress = getClientIp(req);
        const location = await getLocationFromIp(req);

        return this.profileService.UpdateProfile(user, dto, profileImage, ipAddress, location)
    }

    @Post('/update-password')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @Permission("UPDATE_PASSWORD")
    async UpdatePassword(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: UpdatePasswordDTO,
        @Req() request: Request,
    ) {
        const ipAddress = getClientIp(request);
        const location = await getLocationFromIp(request);
        const userAgent = request.headers['user-agent'] || null

        return this.profileService.UpdatePassword(
            user,
            dto,
            ipAddress,
            location,
            userAgent
        )
    }
}
