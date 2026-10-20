
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as geoip from 'geoip-lite';
import { User, UserDocument } from 'src/user/schema/user.schema';
import {
    AuditLog,
    AuditLogDocument,
    AuditAction,
    AuditResult,
} from 'src/audit/schemas/audit-log.schema';

export interface FraudRiskResult {
    riskScore: number;
    requiresMfa: boolean;
    signals: {
        newDevice: boolean;
        ipChanged: boolean;
        locationChanged: boolean;
        unusualLoginTime: boolean;
    };
}

interface LoginAuditHistoryItem {
    ipAddress?: string | null;
    createdAt?: Date;
    action?: AuditAction;
    result?: AuditResult;
    metadata?: {
        deviceId?: string | null;
        registrationIpAddress?: string | null;
    };
}

@Injectable()
export class FraudGuard {
    private readonly MFA_THRESHOLD = 30;
    private readonly HISTORY_LIMIT = 20;

    constructor(
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,

        @InjectModel(AuditLog.name)
        private readonly auditLogModel: Model<AuditLogDocument>,
    ) { }

    async evaluateLoginRisk(
        userId: Types.ObjectId,
        deviceId: string,
        ipAddress: string,
    ): Promise<FraudRiskResult> {
        const user = await this.userModel
            .findById(userId)
            .select('trustedDeviceIds lastLoginIp lastLoginAt')
            .lean();

        if (!user) {
            throw new Error('User not found during fraud risk evaluation');
        }

        const history = (await this.auditLogModel
            .find({
                userId,
                action: {
                    $in: [
                        AuditAction.LOGIN,
                        AuditAction.EMAIL_VERIFICATION_REQUESTED,
                    ],
                },
                $or: [
                    { result: AuditResult.SUCCESS },
                    { action: AuditAction.EMAIL_VERIFICATION_REQUESTED },
                ],
            })
            .sort({ createdAt: -1 })
            .limit(this.HISTORY_LIMIT)
            .select('ipAddress metadata createdAt action result')
            .lean()
            .exec()) as unknown as LoginAuditHistoryItem[];

        const successfulLogins = history.filter(
            (event) => event.action === AuditAction.LOGIN && event.result === AuditResult.SUCCESS,
        );

        const registration = history.find(
            (event) => event.action === AuditAction.EMAIL_VERIFICATION_REQUESTED,
        );

        const trustedDeviceIds = user.trustedDeviceIds ?? [];

        const knownDeviceIds = [
            ...trustedDeviceIds,
            ...history
                .map((event) => event.metadata?.deviceId)
                .filter((id): id is string => Boolean(id)),
        ];



        const newDevice = Boolean(
            deviceId &&
            !trustedDeviceIds.includes(deviceId),
        );

        const latestLoginIp =
            successfulLogins.find((event) => event.ipAddress)?.ipAddress ??
            registration?.metadata?.registrationIpAddress ??
            registration?.ipAddress ??
            user.lastLoginIp;

        const ipChanged = Boolean(
            latestLoginIp &&
            ipAddress &&
            latestLoginIp !== ipAddress,
        );

        let locationChanged = false;

        if (latestLoginIp && ipAddress && latestLoginIp !== ipAddress) {
            const previousLocation = geoip.lookup(latestLoginIp);
            const currentLocation = geoip.lookup(ipAddress);

            if (previousLocation && currentLocation) {
                locationChanged = previousLocation.country !== currentLocation.country || previousLocation.region !== currentLocation.region;
            }
        }

        let unusualLoginTime = false;

        const previousLoginHours = successfulLogins
            .filter((event) => event.createdAt)
            .map((event) => new Date(event.createdAt!).getUTCHours());

        if (previousLoginHours.length >= 5) {
            const currentHour = new Date().getUTCHours();

            const unusualHours = previousLoginHours.filter((hour) => {
                const difference = Math.abs(currentHour - hour);
                return Math.min(difference, 24 - difference) >= 6;
            });

            unusualLoginTime = unusualHours.length / previousLoginHours.length >= 0.7;
        }

        let riskScore = 0;

        if (deviceId && newDevice) riskScore += 30;
        if (ipChanged) riskScore += 20;
        if (locationChanged) riskScore += 25;
        if (unusualLoginTime) riskScore += 15;

        riskScore = Math.min(riskScore, 100);

        return {
            riskScore,
            requiresMfa: riskScore >= this.MFA_THRESHOLD,
            signals: {
                newDevice,
                ipChanged,
                locationChanged,
                unusualLoginTime,
            },
        };
    }
}
