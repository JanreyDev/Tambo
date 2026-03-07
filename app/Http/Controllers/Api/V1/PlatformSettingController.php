<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\PlatformSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlatformSettingController extends Controller
{
    /**
     * List all platform settings, grouped by category.
     */
    public function index(): JsonResponse
    {
        $settings = PlatformSetting::orderBy('group')
            ->orderBy('key')
            ->get();

        $grouped = $settings->groupBy('group')->map(function ($groupSettings) {
            return $groupSettings->map(fn (PlatformSetting $setting) => [
                'id' => $setting->id,
                'key' => $setting->key,
                'value' => $setting->value,
                'type' => $setting->type,
                'description' => $setting->description,
                'updated_at' => $setting->updated_at,
            ]);
        });

        return response()->json([
            'data' => $grouped,
        ]);
    }

    /**
     * Update a specific platform setting by group and key.
     */
    public function update(Request $request, string $group, string $key): JsonResponse
    {
        $setting = PlatformSetting::where('group', $group)
            ->where('key', $key)
            ->firstOrFail();

        $validated = $request->validate([
            'value' => ['present', 'nullable'],
        ]);

        $oldValue = $setting->value;
        $newValue = $validated['value'];

        // Store arrays/objects as JSON strings
        if (is_array($newValue) || is_object($newValue)) {
            $newValue = json_encode($newValue);
        } elseif ($newValue !== null) {
            $newValue = (string) $newValue;
        }

        $setting->update(['value' => $newValue]);

        AuditLog::log(
            adminUserId: $request->user()->id,
            action: 'update',
            resourceType: 'platform_setting',
            resourceId: $setting->id,
            description: "Updated setting {$group}.{$key}",
            metadata: [
                'old_value' => $oldValue,
                'new_value' => $newValue,
            ],
            ipAddress: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return response()->json([
            'message' => 'Setting updated successfully.',
            'data' => [
                'id' => $setting->id,
                'group' => $setting->group,
                'key' => $setting->key,
                'value' => $setting->value,
                'type' => $setting->type,
                'description' => $setting->description,
            ],
        ]);
    }
}
