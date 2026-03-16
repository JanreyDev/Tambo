<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Marketplace\MarketplaceCartItem;
use App\Models\Marketplace\MarketplaceOrder;
use App\Models\Marketplace\MarketplaceOrderItem;
use App\Models\Marketplace\MarketplaceProduct;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MarketplaceController extends Controller
{
    // ── Products ──────────────────────────────────────────────────────

    /**
     * GET /api/v1/marketplace/products
     */
    public function products(Request $request): JsonResponse
    {
        $query = MarketplaceProduct::where('is_active', true);

        if ($category = $request->get('category')) {
            $query->where('category', $category);
        }
        if ($search = $request->get('search')) {
            $query->where('name', 'ilike', "%{$search}%");
        }
        if ($request->boolean('featured')) {
            $query->where('is_featured', true);
        }

        $sortBy = $request->get('sort_by', 'is_featured');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowed = ['name', 'price', 'rating', 'total_orders', 'is_featured'];
        if (in_array($sortBy, $allowed)) {
            $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');
        }

        $perPage = min((int) $request->get('per_page', 24), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * GET /api/v1/marketplace/products/{id}
     */
    public function product(string $id): JsonResponse
    {
        $product = MarketplaceProduct::where('is_active', true)->findOrFail($id);
        return response()->json(['product' => $product]);
    }

    // ── Cart ──────────────────────────────────────────────────────────

    /**
     * GET /api/v1/marketplace/cart
     */
    public function cart(Request $request): JsonResponse
    {
        $user = $request->user();
        $items = MarketplaceCartItem::where('user_id', $user->id)
            ->where('barangay_id', $user->barangay_id)
            ->with('product')
            ->get()
            ->map(fn($item) => [
                'id' => $item->id,
                'product' => $item->product,
                'quantity' => $item->quantity,
                'subtotal' => $item->product ? $item->product->price * $item->quantity : 0,
            ]);

        $total = $items->sum('subtotal');

        return response()->json(['items' => $items, 'total' => $total, 'count' => $items->count()]);
    }

    /**
     * POST /api/v1/marketplace/cart
     */
    public function addToCart(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'uuid', 'exists:marketplace_products,id'],
            'quantity' => ['integer', 'min:1', 'max:999'],
        ]);

        $user = $request->user();

        $cartItem = MarketplaceCartItem::updateOrCreate(
            ['user_id' => $user->id, 'product_id' => $validated['product_id']],
            [
                'barangay_id' => $user->barangay_id,
                'quantity' => $validated['quantity'] ?? 1,
            ]
        );

        return response()->json(['cart_item' => $cartItem->load('product')], 201);
    }

    /**
     * PATCH /api/v1/marketplace/cart/{id}
     */
    public function updateCart(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $item = MarketplaceCartItem::where('user_id', $user->id)->findOrFail($id);

        $validated = $request->validate(['quantity' => ['required', 'integer', 'min:1', 'max:999']]);
        $item->update($validated);

        return response()->json(['cart_item' => $item->load('product')]);
    }

    /**
     * DELETE /api/v1/marketplace/cart/{id}
     */
    public function removeFromCart(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        MarketplaceCartItem::where('user_id', $user->id)->findOrFail($id)->delete();
        return response()->json(['message' => 'Removed from cart.']);
    }

    // ── Orders ────────────────────────────────────────────────────────

    /**
     * GET /api/v1/marketplace/orders
     */
    public function orders(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = MarketplaceOrder::where('barangay_id', $user->barangay_id)
            ->with('items');

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        $perPage = min((int) $request->get('per_page', 20), 100);

        return response()->json($query->orderByDesc('created_at')->paginate($perPage));
    }

    /**
     * GET /api/v1/marketplace/orders/{id}
     */
    public function order(Request $request, string $id): JsonResponse
    {
        $order = MarketplaceOrder::where('barangay_id', $request->user()->barangay_id)
            ->with('items.product')
            ->findOrFail($id);

        return response()->json(['order' => $order]);
    }

    /**
     * POST /api/v1/marketplace/orders — checkout from cart
     */
    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'delivery_address' => ['required', 'string', 'max:500'],
            'contact_person' => ['required', 'string', 'max:255'],
            'contact_number' => ['required', 'string', 'max:20'],
            'payment_method' => ['in:cod,check,bank_transfer'],
            'notes' => ['nullable', 'string'],
            'po_number' => ['nullable', 'string', 'max:50'],
        ]);

        $user = $request->user();

        $cartItems = MarketplaceCartItem::where('user_id', $user->id)
            ->where('barangay_id', $user->barangay_id)
            ->with('product')
            ->get();

        if ($cartItems->isEmpty()) {
            return response()->json(['error' => 'Cart is empty.'], 422);
        }

        // Auto-generate order number
        $year = now()->format('Y');
        $lastOrder = MarketplaceOrder::where('barangay_id', $user->barangay_id)
            ->where('order_number', 'ilike', "ORD-{$year}-%")
            ->orderByDesc('created_at')
            ->first();
        $seq = $lastOrder
            ? ((int) substr($lastOrder->order_number, -4)) + 1
            : 1;
        $orderNumber = "ORD-{$year}-" . str_pad((string) $seq, 4, '0', STR_PAD_LEFT);

        $subtotal = $cartItems->sum(fn($i) => $i->product->price * $i->quantity);

        $order = MarketplaceOrder::create([
            ...$validated,
            'barangay_id' => $user->barangay_id,
            'order_number' => $orderNumber,
            'subtotal' => $subtotal,
            'total_amount' => $subtotal,
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'created_by' => $user->id,
        ]);

        foreach ($cartItems as $item) {
            MarketplaceOrderItem::create([
                'order_id' => $order->id,
                'product_id' => $item->product_id,
                'product_name' => $item->product->name,
                'unit' => $item->product->unit,
                'quantity' => $item->quantity,
                'unit_price' => $item->product->price,
                'subtotal' => $item->product->price * $item->quantity,
            ]);

            // Decrease stock
            $item->product->decrement('stock_qty', $item->quantity);
            $item->product->increment('total_orders', $item->quantity);
        }

        // Clear cart
        MarketplaceCartItem::where('user_id', $user->id)->where('barangay_id', $user->barangay_id)->delete();

        return response()->json(['order' => $order->load('items')], 201);
    }

    /**
     * PATCH /api/v1/marketplace/orders/{id}/cancel
     */
    public function cancelOrder(Request $request, string $id): JsonResponse
    {
        $order = MarketplaceOrder::where('barangay_id', $request->user()->barangay_id)
            ->whereIn('status', ['pending'])
            ->findOrFail($id);

        // Restore stock
        foreach ($order->items as $item) {
            MarketplaceProduct::find($item->product_id)?->increment('stock_qty', $item->quantity);
        }

        $order->update(['status' => 'cancelled', 'updated_by' => $request->user()->id]);

        return response()->json(['order' => $order->fresh()]);
    }
}
