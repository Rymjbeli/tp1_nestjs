import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpException,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CvService } from './cv.service';
import { CreateCvDto } from './dto/create-cv.dto';
import { UpdateCvDto } from './dto/update-cv.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CV } from './entities/cv.entity';
import { GetPaginatedTodoDto } from './dto/get-paginated-cvs.dto';
import { GetCvDto } from './dto/get-cv.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller({
  path: 'cv',
  version: '1',
})
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          cb(null, Date.now() + '-' + file.originalname);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedFileTypes = /\.(png|jpeg|jpg)$/i;
        if (!file.originalname.match(allowedFileTypes)) {
          return cb(
            new HttpException(
              'Only PNG, JPEG, and JPG files are allowed',
              HttpStatus.BAD_REQUEST,
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 1000000 },
    }),
  )
  async create(
    @Body() createCvDto: CreateCvDto,
    @UploadedFile(
      // new ParseFilePipe({
      //   validators: [
      //     new MaxFileSizeValidator({ maxSize: 1000000 }),
      //     new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
      //   ],
      // }),
    )
    image: Express.Multer.File,
  ): Promise<CV> {
    createCvDto.path = image ? image.path : '';
    return await this.cvService.create(createCvDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<CV[]> {
    return await this.cvService.findAll();
  }

  @Get('filters')
  async findAllWithFilters(@Query('') queryparams: GetCvDto): Promise<CV[]> {
    return await this.cvService.findAllWithFilters(queryparams);
  }
  @Get('paginated')
  async findPaginated(@Query() queryParams: GetPaginatedTodoDto) {
    return await this.cvService.findAllPaginated(queryParams);
  }
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.cvService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCvDto: UpdateCvDto,
  ): Promise<CV> {
    return await this.cvService.update(id, updateCvDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.cvService.softDelete(id);
  }

  @Get('restore/:id')
  async restore(@Param('id', ParseIntPipe) id: number) {
    return await this.cvService.restore(id);
  }
}
