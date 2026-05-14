import { Injectable, BadRequestException } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { CartItem, Cart } from './interfaces/cart-item.interface';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Injectable()
export class CartService {
  private items: CartItem[] = [];

  constructor(private readonly productsService: ProductsService) {}

  addItem(dto: AddToCartDto): Cart {
    if (dto.quantity <= 0) {
      throw new BadRequestException('Miktar 0 veya negatif olamaz');
    }

    // Ürün var mı ve stok yeterli mi kontrol et
    const product = this.productsService.findOne(dto.productId);
    
    const existingItem = this.items.find(
      (item) => item.productId === dto.productId,
    );

    const totalRequested = (existingItem?.quantity || 0) + dto.quantity;
    if (product.stock < totalRequested) {
      throw new BadRequestException(
        `Yetersiz stok. Mevcut: ${product.stock}`,
      );
    }

    if (existingItem) {
      existingItem.quantity += dto.quantity;
      existingItem.subtotal = existingItem.quantity * existingItem.price;
    } else {
      this.items.push({
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: dto.quantity,
        subtotal: product.price * dto.quantity,
      });
    }

    return this.getCart();
  }

  removeItem(productId: number): Cart {
    const index = this.items.findIndex((item) => item.productId === productId);
    if (index === -1) {
      throw new BadRequestException('Ürün sepette bulunamadı');
    }
    this.items.splice(index, 1);
    return this.getCart();
  }

  getCart(): Cart {
    const total = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    return {
      items: this.items,
      total,
    };
  }

  clearCart(): Cart {
    this.items = [];
    return this.getCart();
  }
}