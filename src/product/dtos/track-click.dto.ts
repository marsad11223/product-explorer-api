import { IsString, IsNotEmpty } from 'class-validator';

export class TrackClickDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}
