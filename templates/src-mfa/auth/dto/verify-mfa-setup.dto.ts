import { IsString, Matches, MinLength } from 'class-validator';

export class VerifyMfaSetupDto {
    @IsString()
    @MinLength(1)
    mfaSetupToken!: string;

    @IsString()
    @Matches(/^\d{6}$/)
    code!: string;
}