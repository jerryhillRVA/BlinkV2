import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import type {
  CreateContentItemRequestContract,
  UpdateContentItemRequestContract,
} from '@blinksocial/contracts';
import { ContentItemsService } from './content-items.service';

@Controller('api/workspaces')
export class ContentItemsController {
  constructor(private readonly service: ContentItemsService) {}

  @Get(':id/content-items/index')
  getIndex(@Param('id') id: string) {
    return this.service.getIndex(id);
  }

  @Get(':id/content-items/archive-index')
  getArchiveIndex(@Param('id') id: string) {
    return this.service.getArchiveIndex(id);
  }

  @Get(':id/content-items/:itemId')
  getItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.service.getItem(id, itemId);
  }

  @Post(':id/content-items')
  createItem(
    @Param('id') id: string,
    @Body() body: CreateContentItemRequestContract,
  ) {
    return this.service.createItem(id, body);
  }

  @Put(':id/content-items/:itemId')
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: UpdateContentItemRequestContract,
  ) {
    return this.service.updateItem(id, itemId, body);
  }

  @Post(':id/content-items/:itemId/archive')
  archiveItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.service.archiveItem(id, itemId);
  }

  @Post(':id/content-items/:itemId/unarchive')
  unarchiveItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.service.unarchiveItem(id, itemId);
  }

  @Delete(':id/content-items/:itemId')
  deleteItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.service.deleteItem(id, itemId);
  }
}
