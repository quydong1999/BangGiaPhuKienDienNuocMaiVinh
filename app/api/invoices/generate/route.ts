import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { productService } from '@/services';

interface FlatProduct {
  productId: string;
  name: string;
  specName: string;
  unit: string;
  price: number;
}

interface GeneratedItem {
  productId: string;
  name: string;
  specName: string;
  unit: string;
  quantity: number;
  price: number;
  total: number;
}

/**
 * Chọn phần tử ngẫu nhiên theo trọng số (weighted random).
 * Sản phẩm có weight cao hơn sẽ được chọn nhiều hơn.
 */
function weightedRandom<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let r = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

/**
 * Tính số lượng dựa trên "tier" giá so với target.
 * - Sản phẩm đắt (>20% target): qty 1-2
 * - Sản phẩm trung bình (5%-20%): qty 1-5
 * - Sản phẩm rẻ (<5% target): qty 3-15
 */
function getQuantityByPriceTier(
  price: number,
  target: number,
  remaining: number
): number {
  const ratio = price / target;
  const maxAffordable = Math.floor(remaining / price);

  let minQty: number, maxQty: number;

  if (ratio > 0.2) {
    // Sản phẩm đắt → ít số lượng
    minQty = 1;
    maxQty = 2;
  } else if (ratio > 0.05) {
    // Sản phẩm trung bình
    minQty = 1;
    maxQty = 5;
  } else {
    // Sản phẩm rẻ → nhiều số lượng
    minQty = 3;
    maxQty = 15;
  }

  // Đảm bảo không vượt budget
  maxQty = Math.min(maxQty, maxAffordable);
  minQty = Math.min(minQty, maxQty);

  return Math.max(1, minQty + Math.floor(Math.random() * (maxQty - minQty + 1)));
}

/**
 * Thuật toán chọn sản phẩm ngẫu nhiên sao cho tổng nằm trong [minTotal, maxTotal].
 *
 * Quy tắc:
 * - Số loại sản phẩm tối đa = target / 50.000 (tối thiểu 2, tối đa 30)
 * - Sản phẩm đắt → ít quantity (1-2), sản phẩm rẻ → nhiều quantity (3-15)
 * - Ưu tiên chọn sản phẩm rẻ (weighted random: weight = 1/price)
 * - Retry tối đa 10 lần nếu thất bại
 */
function generateRandomItems(
  pool: FlatProduct[],
  minTotal: number,
  maxTotal: number
): { items: GeneratedItem[]; totalAmount: number } | null {
  const MAX_RETRIES = 10;

  // Filter sản phẩm có giá > 0 và <= maxTotal
  const validPool = pool.filter(p => p.price > 0 && p.price <= maxTotal);
  if (validPool.length === 0) return null;

  const minPrice = Math.min(...validPool.map(p => p.price));
  if (minPrice > maxTotal) return null;

  for (let retry = 0; retry < MAX_RETRIES; retry++) {
    const target = minTotal + Math.random() * (maxTotal - minTotal);

    // Giới hạn số loại sản phẩm = target / 20.000, clamp [2, 30]
    const maxTypes = Math.max(2, Math.min(30, Math.floor(target / 20000)));

    const items: GeneratedItem[] = [];
    let currentTotal = 0;
    const usedKeys = new Set<string>();

    for (let i = 0; i < maxTypes; i++) {
      const remaining = target - currentTotal;
      if (remaining < minPrice) break;

      // Lọc sản phẩm phù hợp (giá <= remaining, chưa dùng)
      const candidates = validPool.filter(p => {
        const key = `${p.productId}-${p.specName}-${p.unit}`;
        return p.price <= remaining && !usedKeys.has(key);
      });
      if (candidates.length === 0) break;

      // Weighted random: sản phẩm rẻ có weight cao hơn → được chọn nhiều hơn
      const weights = candidates.map(p => 1 / p.price);
      const chosen = weightedRandom(candidates, weights);

      const key = `${chosen.productId}-${chosen.specName}-${chosen.unit}`;
      usedKeys.add(key);

      // Tính quantity dựa trên tier giá
      const quantity = getQuantityByPriceTier(chosen.price, target, remaining);
      const itemTotal = chosen.price * quantity;

      items.push({
        productId: chosen.productId,
        name: chosen.name,
        specName: chosen.specName,
        unit: chosen.unit,
        quantity,
        price: chosen.price,
        total: itemTotal,
      });

      currentTotal += itemTotal;

      // Nếu đã đạt target → dừng sớm
      if (currentTotal >= target * 0.9) break;
    }

    // Fine-tune: điều chỉnh quantity của item cuối để đạt khoảng [min, max]
    if (items.length > 0) {
      // Chọn item rẻ nhất để fine-tune (dễ điều chỉnh chính xác hơn)
      const cheapestIdx = items.reduce(
        (minIdx, item, idx) => (item.price < items[minIdx].price ? idx : minIdx),
        0
      );
      const tuneItem = items[cheapestIdx];

      if (currentTotal < minTotal) {
        const deficit = minTotal - currentTotal;
        const extraQty = Math.ceil(deficit / tuneItem.price);
        tuneItem.quantity += extraQty;
        tuneItem.total = tuneItem.price * tuneItem.quantity;
        currentTotal += extraQty * tuneItem.price;
      }

      if (currentTotal > maxTotal) {
        const excess = currentTotal - maxTotal;
        const reduceQty = Math.ceil(excess / tuneItem.price);
        tuneItem.quantity = Math.max(1, tuneItem.quantity - reduceQty);
        tuneItem.total = tuneItem.price * tuneItem.quantity;
        currentTotal = items.reduce((sum, item) => sum + item.total, 0);
      }
    }

    // Kiểm tra kết quả
    if (currentTotal >= minTotal && currentTotal <= maxTotal && items.length > 0) {
      // Sắp xếp: sản phẩm đắt lên trước, rẻ xuống sau
      items.sort((a, b) => b.price - a.price);
      return { items, totalAmount: currentTotal };
    }
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { minTotal, maxTotal } = body;

    // Validation
    if (!minTotal || !maxTotal || minTotal <= 0 || maxTotal <= 0) {
      return NextResponse.json(
        { error: 'Giá trị A và B phải lớn hơn 0' },
        { status: 400 }
      );
    }
    if (minTotal > maxTotal) {
      return NextResponse.json(
        { error: 'Giá trị A phải nhỏ hơn hoặc bằng B' },
        { status: 400 }
      );
    }

    // Lấy tất cả sản phẩm → flatten
    const result = await productService.findAll();
    if (!result.success || !result.data || result.data.length === 0) {
      return NextResponse.json(
        { error: 'Không tìm thấy sản phẩm nào trong hệ thống' },
        { status: 400 }
      );
    }

    const flatProducts: FlatProduct[] = result.data.flatMap(product =>
      product.specs.flatMap(spec =>
        spec.prices.map(price => ({
          productId: product._id,
          name: product.name,
          specName: spec.name,
          unit: price.unit,
          price: price.price,
        }))
      )
    );

    // Generate
    const generated = generateRandomItems(flatProducts, minTotal, maxTotal);
    if (!generated) {
      return NextResponse.json(
        { error: `Không thể tạo hóa đơn trong khoảng ${minTotal.toLocaleString()} - ${maxTotal.toLocaleString()} đ. Thử mở rộng khoảng giá trị.` },
        { status: 400 }
      );
    }

    return NextResponse.json(generated);
  } catch (error: any) {
    console.error('Generate invoice error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
