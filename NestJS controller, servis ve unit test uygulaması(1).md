# NestJS controller, servis ve unit test uygulaması

**Created:** 5/7/2026 11:22:53  
**Updated:** 5/14/2026 11:18:52  
**Exported:** 5/14/2026 12:59:15  
**Link:** [https://claude.ai/chat/02da1b25-f474-401e-ad1f-698307d55935](https://claude.ai/chat/02da1b25-f474-401e-ad1f-698307d55935)  

## Response:
07.05.2026 11:23:15

Öğrencilere NestJS'te controller, service ve unit test öğretmek için güzel fikirler vereyim. Pratik ama abartısız, temel kavramları net şekilde gösterecek projeler düşündüm:

**1. Kitap Kütüphanesi API'si (Klasik ama etkili)**
Öğrenciler bir `BooksController` ve `BooksService` yazar. CRUD işlemleri (kitap ekle, listele, güncelle, sil) ve bonus olarak "ödünç alma" mantığı eklenebilir. Test tarafında service mock'lama, controller'ın doğru parametreyle servisi çağırdığını doğrulama, edge case'ler (kitap bulunamadı, zaten ödünç alınmış vs.) öğretmek için ideal.

**2. Görev Yöneticisi (Todo + Kategori)**
İki entity'li olması güzel: `Tasks` ve `Categories`. Böylece servisler arası bağımlılığı (TaskService, CategoryService'i kullanır) ve mock'lamayı öğretebilirsin. "Tamamlanan görevleri filtrele", "kategoriye göre grupla" gibi metotlar test yazımı için zengin senaryolar sunar.

**3. Basit E-Ticaret Sepeti**
`ProductsController`, `CartController`, `CartService`. İş kuralları test için harika: stoktan fazla ürün eklenmesin, indirim hesaplama doğru mu, sepet toplamı doğru hesaplanıyor mu. Öğrenciler `expect().toThrow()` kullanmayı, business logic test etmeyi öğrenir.

**4. Film/Dizi İnceleme Sistemi**
`MoviesService` ve `ReviewsService`. Ortalama puan hesaplama, en yüksek puanlı filmleri getirme gibi metotlar var. Bu özellikle saf fonksiyon testleri için güzel — "10 yorumun ortalaması doğru hesaplanıyor mu?" gibi.

**5. Hava Durumu Proxy Servisi (Daha ileri seviye)**
Dış API'ye istek atan bir servis. Burada `HttpService`'i mock'lamayı öğrenirler ki bu gerçek hayatta çok karşılaşılan bir durumdur. Cache mantığı da eklenebilir.

---

**Benim önerim:** Sınıf seviyesine göre **Görev Yöneticisi** veya **Kitap Kütüphanesi** ile başla. Şu kavramları doğal olarak kapsıyorlar:

- DTO'lar ve validation (class-validator)
- Dependency Injection
- Service'i controller'a inject etme
- `Test.createTestingModule` kullanımı
- `jest.fn()` ile mock'lama
- `expect().toHaveBeenCalledWith()` doğrulamaları
- Exception fırlatma testleri (NotFoundException vs.)

İstersen bu fikirlerden birini seçip detaylı bir ödev dokümanı (gereksinimler, beklenen endpoint'ler, yazılması gereken testler listesi, değerlendirme kriterleri) hazırlayabilirim. Hangisi ilgini çekti?



## Response:
07.05.2026 11:23:48

Harika seçim! E-ticaret sepeti hem ilgi çekici hem de test senaryoları açısından zengin. Sana adım adım, öğrencilerin takip edebileceği şekilde detaylı bir ödev dokümanı hazırlayayım.

Önce senin için bazı detayları netleştirelim ki ödev tam ihtiyacına göre olsun:

````plaintext
Tool: Generating ask_user_input_v0...
````





## Response:
07.05.2026 11:25:46

Mükemmel, başlangıç seviyesine uygun, in-memory ile sade bir yapı kuralım. Şimdi adım adım ilerleyelim.

---

## 🛒 Basit E-Ticaret Sepeti Uygulaması

### 📋 Genel Yapı

Üç ana modül kuracağız:
- **Products** → Ürün CRUD ve stok yönetimi
- **Cart** → Sepete ekleme/çıkarma, toplam hesaplama
- Her modülün kendi controller, service ve test dosyaları olacak

---

## ADIM 1: Proje Kurulumu

Öğrencilerin terminalde çalıştıracağı komutlar:

```bash
npm i -g @nestjs/cli
nest new ecommerce-cart
cd ecommerce-cart
```

Geldiğinde paket yöneticisi soracak, `npm` seçsinler.

Test edelim:
```bash
npm run start:dev
```

Tarayıcıda `http://localhost:3000` → "Hello World!" görmeliler.

---

## ADIM 2: Products Modülünü Oluşturma

Terminalden Nest CLI ile generate edelim:

```bash
nest g module products
nest g controller products
nest g service products
```

Bu komutlar otomatik olarak `src/products/` klasörünü oluşturur ve dosyaları `AppModule`'e bağlar.

### 2.1 Product Interface'i

`src/products/interfaces/product.interface.ts` dosyasını oluştur:

```typescript
export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}
```

### 2.2 DTO'ları Oluştur

`src/products/dto/create-product.dto.ts`:

```typescript
export class CreateProductDto {
  name: string;
  price: number;
  stock: number;
}
```

`src/products/dto/update-product.dto.ts`:

```typescript
export class UpdateProductDto {
  name?: string;
  price?: number;
  stock?: number;
}
```

### 2.3 ProductsService

`src/products/products.service.ts`:

```typescript
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
```

### 2.4 ProductsController

`src/products/products.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  HttpCode,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    this.productsService.remove(id);
  }
}
```

### 2.5 ProductsModule'ü Export Et

`src/products/products.module.ts` (Cart modülü kullanabilsin diye):

```typescript
import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService], // ⭐ ÖNEMLİ: Cart servisi kullanacak
})
export class ProductsModule {}
```

### 🧪 Test Etme Zamanı

Postman veya curl ile:

```bash
# Ürün ekle
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Laptop","price":15000,"stock":10}'

# Listele
curl http://localhost:3000/products
```

---

## ADIM 3: Cart Modülünü Oluşturma

```bash
nest g module cart
nest g controller cart
nest g service cart
```

### 3.1 CartItem Interface

`src/cart/interfaces/cart-item.interface.ts`:

```typescript
export interface CartItem {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}
```

### 3.2 DTO

`src/cart/dto/add-to-cart.dto.ts`:

```typescript
export class AddToCartDto {
  productId: number;
  quantity: number;
}
```

### 3.3 CartService

`src/cart/cart.service.ts`:

```typescript
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
```

### 3.4 CartController

`src/cart/cart.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart() {
    return this.cartService.getCart();
  }

  @Post('items')
  addItem(@Body() dto: AddToCartDto) {
    return this.cartService.addItem(dto);
  }

  @Delete('items/:productId')
  removeItem(@Param('productId', ParseIntPipe) productId: number) {
    return this.cartService.removeItem(productId);
  }

  @Delete()
  clearCart() {
    return this.cartService.clearCart();
  }
}
```

### 3.5 CartModule

`src/cart/cart.module.ts`:

```typescript
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
```

---

## ADIM 4: Unit Testler ✅

Burası işin en öğretici kısmı. CLI zaten her servis ve controller için `.spec.ts` dosyası oluşturdu.

### 4.1 ProductsService Testleri

`src/products/products.service.spec.ts` dosyasını şu şekilde güncelle:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsService],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('create', () => {
    it('yeni bir ürün oluşturmalı', () => {
      const dto = { name: 'Laptop', price: 15000, stock: 10 };
      const product = service.create(dto);

      expect(product).toEqual({
        id: 1,
        name: 'Laptop',
        price: 15000,
        stock: 10,
      });
    });

    it('negatif fiyat ile hata fırlatmalı', () => {
      const dto = { name: 'Laptop', price: -100, stock: 10 };
      expect(() => service.create(dto)).toThrow(BadRequestException);
    });

    it('negatif stok ile hata fırlatmalı', () => {
      const dto = { name: 'Laptop', price: 100, stock: -5 };
      expect(() => service.create(dto)).toThrow(BadRequestException);
    });

    it('her ürüne benzersiz ID vermeli', () => {
      const p1 = service.create({ name: 'A', price: 10, stock: 1 });
      const p2 = service.create({ name: 'B', price: 20, stock: 2 });
      expect(p1.id).toBe(1);
      expect(p2.id).toBe(2);
    });
  });

  describe('findAll', () => {
    it('boş array döndürmeli', () => {
      expect(service.findAll()).toEqual([]);
    });

    it('tüm ürünleri döndürmeli', () => {
      service.create({ name: 'A', price: 10, stock: 1 });
      service.create({ name: 'B', price: 20, stock: 2 });
      expect(service.findAll()).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('ID ile ürün bulmalı', () => {
      const created = service.create({ name: 'A', price: 10, stock: 1 });
      const found = service.findOne(created.id);
      expect(found).toEqual(created);
    });

    it('ürün bulunamazsa NotFoundException fırlatmalı', () => {
      expect(() => service.findOne(999)).toThrow(NotFoundException);
    });
  });

  describe('decreaseStock', () => {
    it('stoğu doğru şekilde azaltmalı', () => {
      const product = service.create({ name: 'A', price: 10, stock: 10 });
      service.decreaseStock(product.id, 3);
      expect(service.findOne(product.id).stock).toBe(7);
    });

    it('yetersiz stokta hata fırlatmalı', () => {
      const product = service.create({ name: 'A', price: 10, stock: 5 });
      expect(() => service.decreaseStock(product.id, 10)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('ürünü silmeli', () => {
      const product = service.create({ name: 'A', price: 10, stock: 1 });
      service.remove(product.id);
      expect(service.findAll()).toHaveLength(0);
    });

    it('olmayan ürünü silmeye çalışınca hata fırlatmalı', () => {
      expect(() => service.remove(999)).toThrow(NotFoundException);
    });
  });
});
```

### 4.2 CartService Testleri (Mock kullanımı! ⭐)

`src/cart/cart.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CartService } from './cart.service';
import { ProductsService } from '../products/products.service';

describe('CartService', () => {
  let service: CartService;
  let productsService: ProductsService;

  // ProductsService'in sahte (mock) versiyonu
  const mockProductsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    productsService = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addItem', () => {
    it('sepete ürün eklemeli', () => {
      mockProductsService.findOne.mockReturnValue({
        id: 1,
        name: 'Laptop',
        price: 15000,
        stock: 10,
      });

      const cart = service.addItem({ productId: 1, quantity: 2 });

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.items[0].subtotal).toBe(30000);
      expect(cart.total).toBe(30000);
      expect(productsService.findOne).toHaveBeenCalledWith(1);
    });

    it('aynı ürün eklenirse miktarı arttırmalı', () => {
      mockProductsService.findOne.mockReturnValue({
        id: 1,
        name: 'Laptop',
        price: 15000,
        stock: 10,
      });

      service.addItem({ productId: 1, quantity: 2 });
      const cart = service.addItem({ productId: 1, quantity: 3 });

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(5);
      expect(cart.total).toBe(75000);
    });

    it('stok yetersizse hata fırlatmalı', () => {
      mockProductsService.findOne.mockReturnValue({
        id: 1,
        name: 'Laptop',
        price: 15000,
        stock: 2,
      });

      expect(() =>
        service.addItem({ productId: 1, quantity: 5 }),
      ).toThrow(BadRequestException);
    });

    it('miktar 0 veya negatifse hata fırlatmalı', () => {
      expect(() =>
        service.addItem({ productId: 1, quantity: 0 }),
      ).toThrow(BadRequestException);

      expect(() =>
        service.addItem({ productId: 1, quantity: -1 }),
      ).toThrow(BadRequestException);
    });

    it('ürün yoksa ProductsService hatasını yansıtmalı', () => {
      mockProductsService.findOne.mockImplementation(() => {
        throw new NotFoundException();
      });

      expect(() =>
        service.addItem({ productId: 999, quantity: 1 }),
      ).toThrow(NotFoundException);
    });
  });

  describe('getCart', () => {
    it('boş sepet döndürmeli', () => {
      const cart = service.getCart();
      expect(cart.items).toEqual([]);
      expect(cart.total).toBe(0);
    });

    it('toplam fiyatı doğru hesaplamalı', () => {
      mockProductsService.findOne
        .mockReturnValueOnce({ id: 1, name: 'A', price: 100, stock: 10 })
        .mockReturnValueOnce({ id: 2, name: 'B', price: 50, stock: 10 });

      service.addItem({ productId: 1, quantity: 2 }); // 200
      service.addItem({ productId: 2, quantity: 3 }); // 150

      const cart = service.getCart();
      expect(cart.total).toBe(350);
    });
  });

  describe('removeItem', () => {
    it('sepetten ürün silmeli', () => {
      mockProductsService.findOne.mockReturnValue({
        id: 1, name: 'A', price: 100, stock: 10,
      });

      service.addItem({ productId: 1, quantity: 2 });
      const cart = service.removeItem(1);

      expect(cart.items).toHaveLength(0);
      expect(cart.total).toBe(0);
    });

    it('sepette olmayan ürünü silmeye çalışınca hata fırlatmalı', () => {
      expect(() => service.removeItem(999)).toThrow(BadRequestException);
    });
  });

  describe('clearCart', () => {
    it('sepeti temizlemeli', () => {
      mockProductsService.findOne.mockReturnValue({
        id: 1, name: 'A', price: 100, stock: 10,
      });

      service.addItem({ productId: 1, quantity: 2 });
      const cart = service.clearCart();

      expect(cart.items).toEqual([]);
      expect(cart.total).toBe(0);
    });
  });
});
```

### 4.3 Controller Testleri

`src/products/products.controller.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

  const mockProductsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('create: servisin create metodunu doğru parametrelerle çağırmalı', () => {
    const dto = { name: 'Laptop', price: 15000, stock: 10 };
    const expected = { id: 1, ...dto };
    mockProductsService.create.mockReturnValue(expected);

    const result = controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('findAll: servisin findAll metodunu çağırmalı', () => {
    mockProductsService.findAll.mockReturnValue([]);
    controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
  });

  it('findOne: ID parametresini servise iletmeli', () => {
    mockProductsService.findOne.mockReturnValue({ id: 1 });
    controller.findOne(1);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });
});
```

### 🏃 Testleri Çalıştır

```bash
# Tüm testleri çalıştır
npm run test

# Watch modunda
npm run test:watch

# Coverage raporu (öğrenciler bunu görsün!)
npm run test:cov
```

---

## ADIM 5: Değerlendirme Kriterleri (Öğretmen için)

Öğrencileri şu kriterlerle puanlayabilirsin:

| Kriter | Puan |
|--------|------|
| Products CRUD endpoint'leri çalışıyor | 15 |
| Cart endpoint'leri çalışıyor | 15 |
| Stok kontrolü doğru çalışıyor | 10 |
| ProductsService unit testleri (min 6 test) | 15 |
| CartService unit testleri (mock kullanarak) | 20 |
| Controller testleri | 10 |
| Hata yönetimi (Exception'lar) | 10 |
| Kod kalitesi (DTO, interface kullanımı) | 5 |

**Bonus (+10):** Test coverage %80 üzeri.

---

## 📚 Öğrencilere Vereceğin İpuçları

Bunları ödev dokümanına eklemeni öneririm: NestJS dokümantasyonu (docs.nestjs.com) çok iyidir, başucu kaynağı olmalı. CLI komutlarını ezberlemek yerine kullanarak öğrensinler. Mock kavramı kafa karıştırabilir; "gerçek servisin sahte versiyonu, sadece testte ne döndüreceğini söylüyorsun" şeklinde anlatılabilir. `jest.fn()`, `mockReturnValue()`, `toHaveBeenCalledWith()` üçlüsü bu projede en çok kullanacakları araçlar olacak.

---

İstersen bunu öğrencilerine dağıtabileceğin tek bir PDF veya Word doküman haline getirebilirim. Ya da Postman collection JSON'u hazırlayabilirim, böylece API'leri kolayca test ederler. Hangisi işine yarar?



## Response:
14.05.2026 11:18:52

Harika, testing kısmını detaylıca açıklayan kapsamlı bir referans hazırlayayım. Bu hem senin için hem öğrencilerin başucu kaynağı olacak.

---

# 📘 NestJS Testing & Jest - Kapsamlı Rehber

## BÖLÜM 1: Temel Kavramlar

### Unit Test Nedir?

Unit test, kodun en küçük parçasını (genellikle bir fonksiyonu/metodu) **izole** şekilde test etmektir. "İzole" demek, o fonksiyonun bağımlı olduğu diğer şeyleri (database, başka servisler, HTTP istekleri) gerçek değil **sahte (mock)** versiyonlarla değiştirmek demek.

**Neden?** Çünkü:
- Testler hızlı olmalı (database'e bağlanma yavaştır)
- Testler tahmin edilebilir olmalı (internet kesilirse test patlamasın)
- Sadece test ettiğin metodun hatasını yakalamalısın

### NestJS'te Kullanılan Test Araçları

NestJS, `@nestjs/testing` paketi ile gelir. Bunun altında **Jest** test framework'ü çalışır. Jest, Facebook tarafından geliştirilmiş JavaScript için en yaygın test kütüphanesidir.

---

## BÖLÜM 2: @nestjs/testing Fonksiyonları

### 2.1 `Test.createTestingModule()`

**Ne yapar?** Gerçek `AppModule` yerine, test için **mini bir NestJS modülü** oluşturur. Sadece test edeceğin sınıfı ve onun bağımlılıklarını içerir.

```typescript
const module: TestingModule = await Test.createTestingModule({
  controllers: [ProductsController],  // Test edilecek controller'lar
  providers: [ProductsService],        // Test edilecek/inject edilecek servisler
  imports: [],                          // Gerekirse başka modüller
}).compile();
```

**Açıklama:**
- `controllers` → Controller'ları kaydeder
- `providers` → Service, Repository gibi inject edilebilir sınıfları kaydeder
- `imports` → Başka modüllerden gelen şeyleri eklemek için
- `.compile()` → Modülü "derler" yani hazır hale getirir. **Asenkron** olduğu için `await` gerekir.

### 2.2 `module.get<T>()`

**Ne yapar?** Oluşturduğun test modülünden, istediğin sınıfın **instance'ını** alır. NestJS Dependency Injection sistemi sayesinde, `new` kullanmadan nesne oluşturmuş olursun.

```typescript
service = module.get<ProductsService>(ProductsService);
```

`<ProductsService>` → TypeScript'e "bu bir ProductsService olacak" diyor (tip güvenliği).

### 2.3 `useValue` ile Mock Sağlama

**Ne yapar?** Bir servisin **yerine sahte bir nesne** koyar. Gerçek servisin yerine senin verdiğin objeyi kullanır.

```typescript
{
  provide: ProductsService,    // Bu sınıf istendiğinde
  useValue: mockProductsService, // Bunu ver
}
```

Bu çok önemli! CartService normalde ProductsService'i kullanır, ama testte gerçeğini değil, kontrol ettiğimiz sahte versiyonunu kullanmasını istiyoruz.

### 2.4 Diğer Provider Stratejileri

```typescript
// useClass: Başka bir sınıfı kullan
{ provide: ProductsService, useClass: MockProductsService }

// useFactory: Bir fonksiyon ile oluştur
{ provide: ProductsService, useFactory: () => new ProductsService() }

// useValue: Direkt bir değer/obje ver (en yaygın)
{ provide: ProductsService, useValue: { findOne: jest.fn() } }
```

---

## BÖLÜM 3: Jest Fonksiyonları

### 3.1 `describe()`

**Ne yapar?** Testleri **gruplar**. Birbirine ait testleri bir araya toplar. İç içe kullanılabilir.

```typescript
describe('ProductsService', () => {       // Ana grup
  describe('create', () => {              // Alt grup: create metodu testleri
    it('ürün oluşturmalı', () => { ... });
    it('hata fırlatmalı', () => { ... });
  });
  
  describe('findOne', () => {             // Alt grup: findOne metodu testleri
    it('ürün bulmalı', () => { ... });
  });
});
```

**Avantajı:** Test çıktısında hiyerarşik görünür:
```
ProductsService
  create
    ✓ ürün oluşturmalı
    ✓ hata fırlatmalı
  findOne
    ✓ ürün bulmalı
```

### 3.2 `it()` veya `test()`

**Ne yapar?** Tek bir test senaryosu tanımlar. İkisi de aynı şeyi yapar, `it` daha okunur ("it should do X").

```typescript
it('negatif fiyatla hata fırlatmalı', () => {
  // Test kodu burada
});
```

**Kural:** Test ismi cümle gibi olmalı, ne test ettiğini açıkça söylemeli.

### 3.3 `expect()`

**Ne yapar?** Test edilen değeri kontrol eder. **Matcher**'lar ile beklentini ifade edersin.

```typescript
expect(actualValue).toBe(expectedValue);
```

### 3.4 Yaygın Matcher'lar

**Eşitlik kontrolleri:**

```typescript
expect(value).toBe(5);              // === karşılaştırma (primitive için)
expect(obj).toEqual({ a: 1 });      // Derin eşitlik (object/array için)
expect(value).toStrictEqual({...});  // toEqual'dan daha katı (undefined dahil)
```

**Önemli fark:** `toBe` referans karşılaştırır, `toEqual` içerik karşılaştırır.
```typescript
expect({a:1}).toBe({a:1});      // ❌ FAIL (farklı referans)
expect({a:1}).toEqual({a:1});   // ✅ PASS (içerik aynı)
```

**Truthy/Falsy kontrolleri:**

```typescript
expect(value).toBeTruthy();      // Doğru bir değer mi
expect(value).toBeFalsy();       // Yanlış bir değer mi
expect(value).toBeNull();        // null mu
expect(value).toBeUndefined();   // undefined mu
expect(value).toBeDefined();     // tanımlı mı
```

**Sayı kontrolleri:**

```typescript
expect(value).toBeGreaterThan(3);
expect(value).toBeGreaterThanOrEqual(3);
expect(value).toBeLessThan(10);
expect(value).toBeCloseTo(0.3);  // Float karşılaştırma (0.1+0.2 sorunu)
```

**String kontrolleri:**

```typescript
expect('Hello World').toMatch(/World/);
expect('Hello').toContain('ell');
```

**Array/Object kontrolleri:**

```typescript
expect(array).toHaveLength(3);
expect(array).toContain('item');
expect(obj).toHaveProperty('name');
expect(obj).toHaveProperty('user.email');  // İç içe property
```

**Exception (Hata) kontrolleri:**

```typescript
// Hata fırlatıyor mu
expect(() => service.findOne(999)).toThrow();

// Belirli tipte hata mı
expect(() => service.findOne(999)).toThrow(NotFoundException);

// Belirli mesajla mı
expect(() => service.findOne(999)).toThrow('bulunamadı');
```

⚠️ **Dikkat:** Hata fırlatabilecek kodu **mutlaka arrow function** içinde çağır! Yoksa hata test başlamadan patlar.

### 3.5 `jest.fn()` - Mock Fonksiyonlar

**Ne yapar?** Sahte bir fonksiyon oluşturur. Bu fonksiyon:
- Çağrıldığını kaydeder
- Hangi parametrelerle çağrıldığını hatırlar
- İstediğin değeri döndürebilir

```typescript
const mockFn = jest.fn();
mockFn('hello');
mockFn('world');

console.log(mockFn.mock.calls);  // [['hello'], ['world']]
```

**Mock'a değer döndürtmek:**

```typescript
// Her çağrıda aynı değeri döndür
mockFn.mockReturnValue({ id: 1, name: 'Laptop' });

// Sadece bir kere bu değeri döndür, sonra normal
mockFn.mockReturnValueOnce({ id: 1 })
      .mockReturnValueOnce({ id: 2 });

// Promise döndürmek için
mockFn.mockResolvedValue({ id: 1 });        // Promise.resolve
mockFn.mockRejectedValue(new Error('hata')); // Promise.reject

// Custom implementation
mockFn.mockImplementation((id) => {
  if (id === 1) return { name: 'Laptop' };
  throw new NotFoundException();
});
```

### 3.6 Mock Kontrol Matcher'ları

Bir mock'un nasıl kullanıldığını test etmek için:

```typescript
// Çağrıldı mı
expect(mockFn).toHaveBeenCalled();

// Kaç kere çağrıldı
expect(mockFn).toHaveBeenCalledTimes(2);

// Şu parametrelerle çağrıldı mı
expect(mockFn).toHaveBeenCalledWith(1, 'test');

// En son şu parametrelerle çağrıldı
expect(mockFn).toHaveBeenLastCalledWith(5);

// İlk çağrıda şu parametrelerle çağrıldı
expect(mockFn).toHaveBeenNthCalledWith(1, 'first');
```

### 3.7 Lifecycle Hooks (Yaşam Döngüsü)

Testlerden önce/sonra çalışan fonksiyonlar:

```typescript
describe('ProductsService', () => {
  
  beforeAll(() => {
    // Tüm testlerden ÖNCE bir kez çalışır
    // Genellikle: DB bağlantısı kurma
  });

  beforeEach(() => {
    // HER testten önce çalışır
    // Genellikle: Service'i sıfırlama, mock'ları temizleme
  });

  afterEach(() => {
    // HER testten sonra çalışır
    // Genellikle: Mock'ları temizleme
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Tüm testlerden SONRA bir kez çalışır
    // Genellikle: DB bağlantısını kapatma
  });

  it('test 1', () => { ... });
  it('test 2', () => { ... });
});
```

**Çalışma sırası:**
```
beforeAll
  beforeEach → test 1 → afterEach
  beforeEach → test 2 → afterEach
afterAll
```

### 3.8 Mock Temizleme Fonksiyonları

```typescript
jest.clearAllMocks();    // Mock'ların call history'sini temizler
jest.resetAllMocks();    // clearAllMocks + implementation'ları sıfırlar
jest.restoreAllMocks();  // resetAllMocks + orijinal implementation'a döner
```

**Hangisini kullanmalı?** Çoğu zaman `jest.clearAllMocks()` yeterlidir. `afterEach` içinde çağırırsan, her test temiz başlar.

---

## BÖLÜM 4: Uygulamamızdan Detaylı Örnekler

### Örnek 1: ProductsService Test Anatomisi

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;  // Test edilecek servis için değişken

  // 🔧 Her testten önce: TAZE bir service instance'ı oluştur
  // Neden? Çünkü ProductsService array'i memory'de tutuyor.
  // Bir test ürün eklerse, diğer testi etkilemesin diye sıfırlamamız lazım.
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsService],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('create metodu', () => {
    it('geçerli DTO ile ürün oluşturmalı', () => {
      // 📦 ARRANGE: Test verilerini hazırla
      const dto = { name: 'Laptop', price: 15000, stock: 10 };

      // 🎬 ACT: Test edilecek metodu çağır
      const result = service.create(dto);

      // ✅ ASSERT: Beklentileri kontrol et
      expect(result).toEqual({
        id: 1,
        name: 'Laptop',
        price: 15000,
        stock: 10,
      });
      expect(result.id).toBeDefined();
      expect(service.findAll()).toHaveLength(1);
    });

    it('negatif fiyat ile BadRequestException fırlatmalı', () => {
      const dto = { name: 'Laptop', price: -100, stock: 10 };

      // Arrow function içinde olmasının sebebi:
      // service.create(dto) DOĞRUDAN çağrılırsa, hata test başlamadan fırlar.
      // Arrow function ile sarınca, expect() onu kontrollü çağırır.
      expect(() => service.create(dto)).toThrow(BadRequestException);
      expect(() => service.create(dto)).toThrow('negatif olamaz');
    });
  });
});
```

**AAA Pattern (Arrange-Act-Assert):** Her test üç bölümden oluşmalı:
1. **Arrange:** Veriyi/ortamı hazırla
2. **Act:** Test edilen kodu çalıştır
3. **Assert:** Sonucu kontrol et

### Örnek 2: CartService - Mock Kullanımı Detaylı

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { ProductsService } from '../products/products.service';

describe('CartService', () => {
  let service: CartService;
  let productsService: ProductsService;

  // 🎭 MOCK OBJESİ
  // ProductsService'in gerçek koduna ihtiyacımız yok.
  // Sadece findOne çağrıldığında ne döneceğini kontrol etmek istiyoruz.
  const mockProductsService = {
    findOne: jest.fn(),
    // Diğer metotları kullanmıyorsak yazmaya gerek yok
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: ProductsService,        // ProductsService istendiğinde
          useValue: mockProductsService,   // mockProductsService'i ver
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    productsService = module.get<ProductsService>(ProductsService);
    // productsService aslında mockProductsService'i tutuyor
  });

  // 🧹 Her testten sonra mock'ları temizle
  // Yoksa: test 1'de findOne çağrıldı → test 2'de "2 kere çağrıldı" gibi yanlış görünür
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addItem', () => {
    it('sepete ürün eklemeli ve toplamı doğru hesaplamalı', () => {
      // 📦 ARRANGE: Mock'a ne döneceğini söyle
      mockProductsService.findOne.mockReturnValue({
        id: 1,
        name: 'Laptop',
        price: 15000,
        stock: 10,
      });

      // 🎬 ACT
      const cart = service.addItem({ productId: 1, quantity: 2 });

      // ✅ ASSERT: Birden fazla şeyi kontrol et
      
      // Mock doğru çağrıldı mı?
      expect(productsService.findOne).toHaveBeenCalledWith(1);
      expect(productsService.findOne).toHaveBeenCalledTimes(1);
      
      // Dönen sonuç doğru mu?
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0]).toEqual({
        productId: 1,
        productName: 'Laptop',
        price: 15000,
        quantity: 2,
        subtotal: 30000,
      });
      expect(cart.total).toBe(30000);
    });

    it('birden fazla ürün için toplam doğru hesaplanmalı', () => {
      // 📦 ARRANGE: Her çağrıda farklı değer dönsün
      mockProductsService.findOne
        .mockReturnValueOnce({ id: 1, name: 'A', price: 100, stock: 10 })
        .mockReturnValueOnce({ id: 2, name: 'B', price: 50, stock: 10 });

      // 🎬 ACT
      service.addItem({ productId: 1, quantity: 2 }); // 200
      const cart = service.addItem({ productId: 2, quantity: 3 }); // 150

      // ✅ ASSERT
      expect(cart.total).toBe(350);
      expect(productsService.findOne).toHaveBeenCalledTimes(2);
    });

    it('ProductsService hata fırlatırsa onu yansıtmalı', () => {
      // 📦 ARRANGE: Mock'ın hata fırlatmasını sağla
      mockProductsService.findOne.mockImplementation(() => {
        throw new NotFoundException('Ürün yok');
      });

      // ✅ ASSERT
      expect(() => service.addItem({ productId: 999, quantity: 1 }))
        .toThrow(NotFoundException);
    });
  });
});
```

### Örnek 3: Controller Testi

Controller testlerinde **service'i mock'larız**. Çünkü controller'ın işi sadece HTTP isteğini servise iletmek; service'in işini test etmiyoruz.

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

  // 🎭 Service'in TÜM metotlarını mock'la
  // (Controller hangi metotları çağırıyorsa)
  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],  // Test edilen controller
      providers: [
        {
          provide: ProductsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create endpoint', () => {
    it('servisin create metodunu doğru parametre ile çağırmalı', () => {
      // 📦 ARRANGE
      const dto = { name: 'Laptop', price: 15000, stock: 10 };
      const expectedResult = { id: 1, ...dto };
      mockService.create.mockReturnValue(expectedResult);

      // 🎬 ACT
      const result = controller.create(dto);

      // ✅ ASSERT
      // Controller, service'i doğru çağırıyor mu?
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(service.create).toHaveBeenCalledTimes(1);
      
      // Controller, service'in döndürdüğünü geri veriyor mu?
      expect(result).toEqual(expectedResult);
    });
  });
});
```

### Örnek 4: Async (Asenkron) Test Örneği

In-memory yapımız senkron, ama database ile çalışırken async olur. Örnek:

```typescript
// Eğer service async olsaydı:
it('async ürün oluşturmalı', async () => {
  mockRepository.save.mockResolvedValue({ id: 1, name: 'Laptop' });

  // await ile bekle
  const result = await service.create({ name: 'Laptop' });

  expect(result.id).toBe(1);
});

// Promise reject testi:
it('hata durumunda reject etmeli', async () => {
  mockRepository.save.mockRejectedValue(new Error('DB hatası'));

  await expect(service.create({ name: 'Laptop' }))
    .rejects
    .toThrow('DB hatası');
});
```

`rejects` ve `resolves` async testlerde kullanılır.

---

## BÖLÜM 5: Test Coverage (Kapsama)

### Coverage Nedir?

Kodun yüzde kaçının testler tarafından çalıştırıldığını gösterir.

```bash
npm run test:cov
```

Bu komut çıktısı şöyle görünür:

```
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
products.service.ts |   95.5  |   88.8   |  100    |   95.5  |
cart.service.ts     |   87.5  |   75.0   |  100    |   87.5  |
```

**Metriklerin anlamı:**
- **Statements:** Çalıştırılan satır sayısı yüzdesi
- **Branch:** If/else dallarının yüzdesi (her dal test edildi mi?)
- **Functions:** Çağrılan fonksiyon yüzdesi
- **Lines:** Çalıştırılan satır yüzdesi

**Hedef:** Genelde %80+ iyi kabul edilir, ama %100'e takılmak şart değil. Önemli olan kritik mantığın test edilmesi.

---

## BÖLÜM 6: package.json'daki Test Komutları

NestJS projesinde varsayılan olarak şu komutlar gelir:

```json
{
  "scripts": {
    "test": "jest",                          // Tüm testleri bir kere çalıştır
    "test:watch": "jest --watch",            // Dosya değişince otomatik çalıştır
    "test:cov": "jest --coverage",           // Coverage raporu üret
    "test:debug": "node --inspect-brk ...",  // Debugger ile çalıştır
    "test:e2e": "jest --config test/jest-e2e.json"  // End-to-end testler
  }
}
```

**Sık kullanılacaklar:**
- `npm run test` → Hızlı kontrol
- `npm run test:watch` → Geliştirme sırasında (kod yazarken otomatik test)
- `npm run test:cov` → Ödev teslimi öncesi coverage kontrolü

**Belirli bir dosyayı test etme:**
```bash
npm run test -- products.service.spec.ts
npm run test -- --testPathPattern=cart
```

**Belirli bir test'i çalıştırma:**
```typescript
// Sadece bu test'i çalıştır
it.only('sadece bunu test et', () => { ... });

// Bu test'i atla
it.skip('bunu atla', () => { ... });

// describe için de geçerli
describe.only('sadece bu grubu test et', () => { ... });
```

---

## BÖLÜM 7: En İyi Pratikler (Best Practices)

**1. Test isimleri açıklayıcı olsun:**
```typescript
// ❌ Kötü
it('test 1', () => { ... });

// ✅ İyi
it('negatif fiyat verildiğinde BadRequestException fırlatmalı', () => { ... });
```

**2. Her test bağımsız olsun:**
Bir test diğerinin sonucuna bağlı olmamalı. `beforeEach` ile her test taze başlamalı.

**3. AAA Pattern'i uygula:**
Arrange-Act-Assert sıralamasına sadık kal.

**4. Bir test bir şeyi test etsin:**
```typescript
// ❌ Kötü: Bir test çok şey kontrol ediyor
it('ürün işlemleri', () => {
  service.create(...);
  service.update(...);
  service.remove(...);
  // Test patlarsa hangisinin sorunu var anlaşılmaz
});

// ✅ İyi: Her senaryo ayrı test
it('ürün oluşturmalı', () => { ... });
it('ürün güncellemeli', () => { ... });
it('ürün silmeli', () => { ... });
```

**5. Mock'ları temizle:**
```typescript
afterEach(() => {
  jest.clearAllMocks();
});
```

**6. Edge case'leri test et:**
- Boş array
- null/undefined
- Negatif sayılar
- Çok büyük sayılar
- Olmayan ID

**7. Sadece public API'yi test et:**
Private metotları doğrudan test etme; onları public metotlar üzerinden test et.

---

## BÖLÜM 8: Sık Karşılaşılan Hatalar ve Çözümleri

**Hata 1: "Cannot find module"**
```bash
# Çözüm
npm install
```

**Hata 2: "Nest can't resolve dependencies"**
Provider'ı eklemeyi unutmuşsundur:
```typescript
// providers array'ine ekle
providers: [
  ProductsService,
  { provide: ProductsService, useValue: mockService }, // Mock kullanıyorsan
]
```

**Hata 3: Test geçiyor ama coverage düşük**
Try/catch dallarını, if/else'leri unutmuşsundur. Her dalı test et.

**Hata 4: "expect(received).toThrow() received function did not throw"**
Hata fırlatabilecek kodu arrow function içine koymadın:
```typescript
// ❌ Yanlış
expect(service.findOne(999)).toThrow();

// ✅ Doğru
expect(() => service.findOne(999)).toThrow();
```

**Hata 5: Mock değer dönmüyor**
`mockReturnValue` çağırmayı unutmuşsundur veya `clearAllMocks` her şeyi sildi.

---

## 📝 Özet Hatırlatma Kartı

| Fonksiyon | Ne İşe Yarar |
|-----------|--------------|
| `Test.createTestingModule()` | Test için mini modül oluşturur |
| `module.compile()` | Modülü hazırlar |
| `module.get<T>()` | Servis/controller instance'ı verir |
| `useValue` | Mock obje sağlar |
| `describe()` | Testleri gruplar |
| `it()` / `test()` | Tek bir test tanımlar |
| `expect()` | Beklenti ifade eder |
| `jest.fn()` | Sahte fonksiyon oluşturur |
| `mockReturnValue()` | Mock'a dönüş değeri verir |
| `mockResolvedValue()` | Mock'a Promise dönüşü verir |
| `mockImplementation()` | Mock'a kendi mantığını verir |
| `toBe()` | Primitive eşitlik |
| `toEqual()` | Derin obje eşitliği |
| `toThrow()` | Hata fırlatma kontrolü |
| `toHaveBeenCalled()` | Mock çağrıldı mı |
| `toHaveBeenCalledWith()` | Hangi parametrelerle çağrıldı |
| `beforeEach()` | Her testten önce çalışır |
| `afterEach()` | Her testten sonra çalışır |
| `jest.clearAllMocks()` | Mock geçmişini temizler |

---

Bu rehberi öğrencilere PDF veya Word olarak dağıtmak istersen, ona göre düzenleyip dosya olarak hazırlayabilirim. Ya da pratik alıştırmalar (öğrencilerin tamamlaması gereken eksik testler) ekleyerek interaktif bir çalışma kâğıdı haline getirebilirim. Hangisi işine yarar?





---
Powered by [Claude Exporter](https://www.ai-chat-exporter.net)