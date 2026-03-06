<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Platform\PlatformUpdate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlatformUpdateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $updates = PlatformUpdate::where('is_published', true)
            ->latest('published_at')
            ->take(20)
            ->get();

        return response()->json(['updates' => $updates]);
    }
}
