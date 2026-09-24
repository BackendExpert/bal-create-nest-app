import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { PassportStrategy } from "@nestjs/passport";
import { Model, Types } from "mongoose";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Session, SessionDocument } from "./schemas/session.schema";
import { JwtPayload } from "./interfaces/jwt-payload.interface";
import { User, UserDocument } from "src/user/schema/user.schema";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        config: ConfigService,

        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,

        @InjectModel(Session.name)
        private readonly sessionModel: Model<SessionDocument>,

    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.getOrThrow<string>('JWT_SECRET')
        })
    }

    async validate(payload: JwtPayload) {
        const user = await this.userModel
            .findById(payload.sub)
            .select('roleId accountStatus emailVerified email')
            .populate('roleId', 'role');

        if (!user) {
            throw new UnauthorizedException('User cannot be found');
        }

        const session = await this.sessionModel.findOne({
            userId: user._id,
            revokedAt: null,
            isActive: true,
        });

        if (!session) {
            throw new UnauthorizedException('Session is no longer active');
        }

        const role = user.roleId as unknown as {
            _id: Types.ObjectId;
            role: string;
        };

        return {
            id: user._id,
            email: user.email,
            roleId: role._id,
            role: role.role,
            institutionId: payload.user?.institutionId?.toString() ?? null,
            accountStatus: user.accountStatus,
            emailVerified: user.emailVerified,
            sessionId: payload.sessionId,
        };
    }
}