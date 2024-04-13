import { Module } from '@nestjs/common';
import { CvService } from './cv.service';
import { CvController, Cv2Controller } from './cv.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CV } from './entities/cv.entity';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CV, User])],
  controllers: [CvController, Cv2Controller],
  providers: [CvService, UserService],
})
export class CvModule {}
