import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CollectionsService } from './collections.service';
import { CurrentUser } from '../shared/current-user.decorator';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateCollectionDto,
  ) {
    return this.collectionsService.create(
      user.id,
      dto.title,
      dto.description,
      dto.isPublic ?? false,
      dto.shareSaves ?? false,
    );
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  findAll(@CurrentUser() user: { id: string }) {
    return this.collectionsService.findAll(user.id);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  findOne(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.collectionsService.findOne(id, user.id);
  }

  @Post(':id/items')
  @UseGuards(AuthGuard('jwt'))
  addItem(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddItemDto) {
    return this.collectionsService.addItem(id, dto.postId, dto.note);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  update(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCollectionDto,
  ) {
    return this.collectionsService.update(id, user.id, dto);
  }

  @Delete(':id/items/:itemId')
  @UseGuards(AuthGuard('jwt'))
  removeItem(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) collectionId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.collectionsService.removeItem(collectionId, itemId, user.id);
  }
}
