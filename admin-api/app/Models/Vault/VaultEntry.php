<?php

declare(strict_types=1);

namespace App\Models\Vault;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class VaultEntry extends Model
{
    use HasUuids;

    protected $table = 'vault_entries';

    public $timestamps = false;

    public const CATEGORIES = [
        'business_overview',
        'financial',
        'team_contacts',
        'clients',
        'infrastructure',
        'guide',
        'legal',
    ];

    /** @var list<string> */
    protected $fillable = [
        'category',
        'title',
        'content_encrypted',
        'sort_order',
        'is_active',
        'metadata',
        'created_at',
        'updated_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Encrypt and set content.
     */
    public function setContent(string $plaintext): void
    {
        $this->content_encrypted = Crypt::encryptString($plaintext);
    }

    /**
     * Decrypt and get content.
     */
    public function getContent(): string
    {
        return Crypt::decryptString($this->content_encrypted);
    }

    /**
     * Scope: active entries only.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: entries by category, ordered.
     */
    public function scopeInCategory(Builder $query, string $category): Builder
    {
        return $query->where('category', $category)->orderBy('sort_order');
    }
}
