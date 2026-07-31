import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { MergeCartDto } from './dto/merge-cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add')
  async addToCart(@Body() addToCartDto: AddToCartDto) {
    return this.cartService.addToCart(addToCartDto);
  }

  @Post('merge')
  async mergeCart(@Body() mergeCartDto: MergeCartDto) {
    return this.cartService.mergeCart(mergeCartDto);
  }

  @Get(':sessionId')
  async getCart(@Param('sessionId') sessionId: string) {
    return this.cartService.getCart(sessionId);
  }

  @Delete(':sessionId')
  async clearCart(@Param('sessionId') sessionId: string) {
    return this.cartService.clearCart(sessionId);
  }
}