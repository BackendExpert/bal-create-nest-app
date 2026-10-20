import { IsString, Matches, MinLength } from 'class-validator';

export class VerifyMfaLoginDto {
    @IsString()
    @MinLength(1)
    mfaChallengeToken!: string;

    @IsString()
    @Matches(/^\d{6}$/)
    code!: string;
}