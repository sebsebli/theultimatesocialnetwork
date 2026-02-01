import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
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
      dto.shareSaves ?? false,
      dto.isPublic ?? true,
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
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit != null ? parseInt(limit, 10) : undefined;
    const offsetNum = offset != null ? parseInt(offset, 10) : undefined;
    return this.collectionsService.findOneForViewer(
      id,
      user.id,
      limitNum,
      offsetNum,
    );
  }

  @Get(':id/items')
  @UseGuards(AuthGuard('jwt'))
  async getItems(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    await this.collectionsService.findOneForViewer(id, user.id);
    return this.collectionsService.getItemsPage(id, limit, offset);
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

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  delete(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.collectionsService.delete(id, user.id);
  }

  /** Remove a post from a collection by postId (e.g. from Add to Collection sheet when on a post). */
  @Delete(':id/items')
  @UseGuards(AuthGuard('jwt'))
  removeItemByPostId(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) collectionId: string,
    @Query('postId', ParseUUIDPipe) postId: string,
  ) {
    return this.collectionsService.removeItemByPostId(
      collectionId,
      postId,
      user.id,
    );
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
