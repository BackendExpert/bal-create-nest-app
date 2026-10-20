import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
    transform(value: string): string {
        if (typeof value !== 'string' || !/^[a-fA-F0-9]{24}$/.test(value)) {
            throw new BadRequestException('id must be a mongodb id');
        }

        return value;
    }
}
