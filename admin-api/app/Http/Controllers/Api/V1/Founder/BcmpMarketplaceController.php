<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Founder;

use App\Http\Controllers\Controller;
use App\Services\BcmpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Proxy controller for BCMP marketplace admin management.
 *
 * Forwards requests from the founder dashboard to bcmp-api's
 * admin/marketplace endpoints. Products are global (no barangay_id).
 * Orders are cross-barangay for fulfillment visibility.
 *
 * All inputs are whitelisted before forwarding to prevent
 * parameter injection through the proxy layer.
 */
class BcmpMarketplaceController extends Controller
{
    /** Allowed fields for creating a product. */
    private const PRODUCT_CREATE_FIELDS = [
        'name',
        'description',
        'category',
        'price',
        'original_price',
        'stock_qty',
        'unit',
        'sku',
        'supplier_name',
        'is_active',
        'is_featured',
        'tag',
    ];

    /** Allowed query params for product listing. */
    private const PRODUCT_FILTER_PARAMS = [
        'search',
        'category',
        'is_active',
        'is_featured',
        'sort_by',
        'sort_dir',
        'per_page',
        'page',
    ];

    /** Allowed query params for order listing. */
    private const ORDER_FILTER_PARAMS = [
        'status',
        'payment_status',
        'barangay_id',
        'search',
        'per_page',
        'page',
    ];

    /** Allowed fields for updating order status. */
    private const ORDER_STATUS_FIELDS = [
        'status',
        'payment_status',
        'expected_delivery_date',
        'delivered_date',
    ];

    public function __construct(private readonly BcmpService $bcmp) {}

    // ── Products ──────────────────────────────────────────────────────

    /**
     * List all marketplace products (admin — includes inactive).
     *
     * GET /api/v1/founder/bcmp/marketplace/products
     */
    public function products(Request $request): JsonResponse
    {
        $params = array_filter(
            $request->only(self::PRODUCT_FILTER_PARAMS),
            fn ($v) => $v !== null && $v !== '',
        );

        $result = $this->bcmp->get('api/v1/admin/marketplace/products', $params);

        return response()->json($result['data'], $result['status']);
    }

    /**
     * Create a new marketplace product.
     *
     * POST /api/v1/founder/bcmp/marketplace/products
     */
    public function storeProduct(Request $request): JsonResponse
    {
        $data = $request->only(self::PRODUCT_CREATE_FIELDS);
        $result = $this->bcmp->post('api/v1/admin/marketplace/products', $data);

        return response()->json($result['data'], $result['status']);
    }

    /**
     * Update a marketplace product.
     *
     * PUT /api/v1/founder/bcmp/marketplace/products/{id}
     */
    public function updateProduct(Request $request, string $id): JsonResponse
    {
        if (! $this->isValidUuid($id)) {
            return response()->json(['message' => 'Invalid ID format.'], 400);
        }

        $data = $request->only(self::PRODUCT_CREATE_FIELDS);
        $result = $this->bcmp->put("api/v1/admin/marketplace/products/{$id}", $data);

        return response()->json($result['data'], $result['status']);
    }

    /**
     * Delete a marketplace product.
     *
     * DELETE /api/v1/founder/bcmp/marketplace/products/{id}
     */
    public function destroyProduct(string $id): JsonResponse
    {
        if (! $this->isValidUuid($id)) {
            return response()->json(['message' => 'Invalid ID format.'], 400);
        }

        $result = $this->bcmp->delete("api/v1/admin/marketplace/products/{$id}");

        return response()->json($result['data'], $result['status']);
    }

    // ── Orders ────────────────────────────────────────────────────────

    /**
     * List all orders across all barangays.
     *
     * GET /api/v1/founder/bcmp/marketplace/orders
     */
    public function orders(Request $request): JsonResponse
    {
        $params = array_filter(
            $request->only(self::ORDER_FILTER_PARAMS),
            fn ($v) => $v !== null && $v !== '',
        );

        $result = $this->bcmp->get('api/v1/admin/marketplace/orders', $params);

        return response()->json($result['data'], $result['status']);
    }

    /**
     * Update order status and/or payment status.
     *
     * PATCH /api/v1/founder/bcmp/marketplace/orders/{id}/status
     */
    public function updateOrderStatus(Request $request, string $id): JsonResponse
    {
        if (! $this->isValidUuid($id)) {
            return response()->json(['message' => 'Invalid ID format.'], 400);
        }

        $data = $request->only(self::ORDER_STATUS_FIELDS);
        $result = $this->bcmp->patch("api/v1/admin/marketplace/orders/{$id}/status", $data);

        return response()->json($result['data'], $result['status']);
    }

    // ── Helpers ──────────────────────────────────────────────────────

    private function isValidUuid(string $id): bool
    {
        return (bool) preg_match('/^[0-9a-f\-]{36}$/i', $id);
    }
}
