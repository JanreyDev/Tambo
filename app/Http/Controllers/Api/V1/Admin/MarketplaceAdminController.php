<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Marketplace\MarketplaceOrder;
use App\Models\Marketplace\MarketplaceProduct;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Admin marketplace management — product catalog and cross-barangay orders.
 *
 * All routes guarded by super_admin middleware (no tenant context).
 * Products are global (no barangay_id). Orders are per-barangay but
 * visible in aggregate here for fulfillment.
 */
class MarketplaceAdminController extends Controller
{
    // ── Products ──────────────────────────────────────────────────────

    /**
     * GET /api/v1/admin/marketplace/products
     *
     * List all products (including inactive) with search/category/status filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = MarketplaceProduct::query();

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('sku', 'ilike', "%{$search}%")
                  ->orWhere('supplier_name', 'ilike', "%{$search}%");
            });
        }

        if ($category = $request->get('category')) {
            $query->where('category', $category);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->has('is_featured')) {
            $query->where('is_featured', $request->boolean('is_featured'));
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowed = ['name', 'price', 'stock_qty', 'total_orders', 'rating', 'created_at', 'is_featured'];
        if (in_array($sortBy, $allowed, true)) {
            $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * POST /api/v1/admin/marketplace/products
     *
     * Create a new marketplace product.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'          => ['required', 'string', 'max:255'],
            'description'   => ['nullable', 'string'],
            'category'      => ['required', 'string', 'max:100'],
            'price'         => ['required', 'numeric', 'min:0'],
            'original_price' => ['nullable', 'numeric', 'min:0'],
            'stock_qty'     => ['required', 'integer', 'min:0'],
            'unit'          => ['required', 'string', 'max:50'],
            'sku'           => ['nullable', 'string', 'max:100', 'unique:marketplace_products,sku'],
            'supplier_name' => ['nullable', 'string', 'max:255'],
            'is_active'     => ['boolean'],
            'is_featured'   => ['boolean'],
            'tag'           => ['nullable', 'string', 'max:50'],
        ]);

        $product = MarketplaceProduct::create([
            ...$validated,
            'rating'       => 0.0,
            'total_orders' => 0,
            'created_by'   => $request->user()?->id,
        ]);

        return response()->json(['product' => $product], 201);
    }

    /**
     * PUT /api/v1/admin/marketplace/products/{id}
     *
     * Update a marketplace product.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $product = MarketplaceProduct::findOrFail($id);

        $validated = $request->validate([
            'name'          => ['sometimes', 'string', 'max:255'],
            'description'   => ['nullable', 'string'],
            'category'      => ['sometimes', 'string', 'max:100'],
            'price'         => ['sometimes', 'numeric', 'min:0'],
            'original_price' => ['nullable', 'numeric', 'min:0'],
            'stock_qty'     => ['sometimes', 'integer', 'min:0'],
            'unit'          => ['sometimes', 'string', 'max:50'],
            'sku'           => ['nullable', 'string', 'max:100', Rule::unique('marketplace_products', 'sku')->ignore($id)],
            'supplier_name' => ['nullable', 'string', 'max:255'],
            'is_active'     => ['sometimes', 'boolean'],
            'is_featured'   => ['sometimes', 'boolean'],
            'tag'           => ['nullable', 'string', 'max:50'],
        ]);

        $product->update([
            ...$validated,
            'updated_by' => $request->user()?->id,
        ]);

        return response()->json(['product' => $product->fresh()]);
    }

    /**
     * DELETE /api/v1/admin/marketplace/products/{id}
     *
     * Soft-delete a product. Blocked if there are pending/confirmed orders.
     */
    public function destroy(string $id): JsonResponse
    {
        $product = MarketplaceProduct::findOrFail($id);

        $blockedOrders = MarketplaceOrder::whereHas('items', fn ($q) => $q->where('product_id', $id))
            ->whereIn('status', ['pending', 'confirmed', 'processing'])
            ->count();

        if ($blockedOrders > 0) {
            return response()->json([
                'message' => "Cannot delete — {$blockedOrders} active order(s) reference this product. Deactivate it instead.",
            ], 422);
        }

        $product->delete();

        return response()->json(['message' => 'Product deleted successfully.']);
    }

    // ── Orders ────────────────────────────────────────────────────────

    /**
     * GET /api/v1/admin/marketplace/orders
     *
     * List all orders across all barangays with optional status/payment filters.
     */
    public function orders(Request $request): JsonResponse
    {
        $query = MarketplaceOrder::with(['items.product'])
            ->orderByDesc('created_at');

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        if ($paymentStatus = $request->get('payment_status')) {
            $query->where('payment_status', $paymentStatus);
        }

        if ($barangayId = $request->get('barangay_id')) {
            $query->where('barangay_id', $barangayId);
        }

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'ilike', "%{$search}%")
                  ->orWhere('contact_person', 'ilike', "%{$search}%")
                  ->orWhere('po_number', 'ilike', "%{$search}%");
            });
        }

        $perPage = min((int) $request->get('per_page', 20), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * PATCH /api/v1/admin/marketplace/orders/{id}/status
     *
     * Update order status and/or payment status.
     */
    public function updateOrderStatus(Request $request, string $id): JsonResponse
    {
        $order = MarketplaceOrder::findOrFail($id);

        $validated = $request->validate([
            'status' => [
                'sometimes',
                Rule::in(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
            ],
            'payment_status' => [
                'sometimes',
                Rule::in(['unpaid', 'partial', 'paid', 'refunded']),
            ],
            'expected_delivery_date' => ['sometimes', 'nullable', 'date'],
            'delivered_date'         => ['sometimes', 'nullable', 'date'],
        ]);

        // If marking as delivered, auto-stamp delivered_date if not provided
        if (isset($validated['status']) && $validated['status'] === 'delivered' && empty($validated['delivered_date'])) {
            $validated['delivered_date'] = now()->toDateString();
        }

        $order->update([
            ...$validated,
            'updated_by' => $request->user()?->id,
        ]);

        return response()->json(['order' => $order->fresh()->load('items.product')]);
    }
}
