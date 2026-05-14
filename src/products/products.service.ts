import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Product } from './interfaces/product.interface';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  private products: Product[] = [];
  private nextId = 1;

  create(dto: CreateProductDto): Product {
    if (dto.price < 0 || dto.stock < 0) {
      throw new BadRequestException('Fiyat ve stok negatif olamaz');
    }
    const product: Product = {
      id: this.nextId++,
      name: dto.name,
      price: dto.price,
      stock: dto.stock,
    };
    this.products.push(product);
    return product;
  }

  findAll(): Product[] {
    return this.products;
  }

  findOne(id: number): Product {
    const product = this.products.find((p) => p.id === id);
    if (!product) {
      throw new NotFoundException(`ID ${id} olan ürün bulunamadı`);
    }
    return product;
  }

  update(id: number, dto: UpdateProductDto): Product {
    const product = this.findOne(id);
    Object.assign(product, dto);
    return product;
  }

  remove(id: number): void {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new NotFoundException(`ID ${id} olan ürün bulunamadı`);
    }
    this.products.splice(index, 1);
  }

  // Stok kontrolü - Cart servisi bunu kullanacak
  decreaseStock(id: number, quantity: number): Product {
    const product = this.findOne(id);
    if (product.stock < quantity) {
      throw new BadRequestException(
        `Yetersiz stok. Mevcut: ${product.stock}, İstenen: ${quantity}`,
      );
    }
    product.stock -= quantity;
    return product;
  }

  increaseStock(id: number, quantity: number): Product {
    const product = this.findOne(id);
    product.stock += quantity;
    return product;
  }
}