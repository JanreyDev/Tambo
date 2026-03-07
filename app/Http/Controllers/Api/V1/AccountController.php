<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    /**
     * Update user preferences (accent color, etc.).
     *
     * PATCH /api/v1/account/preferences
     */
    public function updatePreferences(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'accent_color' => ['sometimes', 'string', 'in:blue,emerald,violet,rose,amber,cyan,orange,indigo'],
            'theme' => ['sometimes', 'string', 'in:light,dark,system'],
        ]);

        $user = $request->user();

        $preferences = $user->preferences ?? [];

        foreach ($validated as $key => $value) {
            $preferences[$key] = $value;
        }

        $user->update(['preferences' => $preferences]);

        return response()->json([
            'message' => 'Preferences updated.',
            'preferences' => $user->preferences,
        ]);
    }
}
