import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [ProductsModule], // ⭐ ProductsService'i kullanmak için
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}