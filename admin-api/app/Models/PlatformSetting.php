<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PlatformSetting extends Model
{
    use HasUuids;

    /**
     * The table associated with the model.
     */
    protected $table = 'platform_settings';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'group',
        'key',
        'value',
        'type',
        'description',
    ];

    /**
     * Get a platform setting value by group and key.
     */
    public static function get(string $group, string $key, mixed $default = null): mixed
    {
        $setting = static::where('group', $group)
            ->where('key', $key)
            ->first();

        if ($setting === null) {
            return $default;
        }

        return self::castValue($setting->value, $setting->type);
    }

    /**
     * Set a platform setting value by group and key.
     */
    public static function set(string $group, string $key, mixed $value, string $type = 'string', ?string $description = null): static
    {
        $storedValue = is_array($value) || is_object($value)
            ? json_encode($value)
            : (string) $value;

        return static::updateOrCreate(
            ['group' => $group, 'key' => $key],
            [
                'value' => $storedValue,
                'type' => $type,
                'description' => $description,
            ],
        );
    }

    /**
     * Cast the stored string value to the appropriate type.
     */
    private static function castValue(?string $value, string $type): mixed
    {
        if ($value === null) {
            return null;
        }

        return match ($type) {
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $value,
            'json' => json_decode($value, true),
            default => $value,
        };
    }
}
