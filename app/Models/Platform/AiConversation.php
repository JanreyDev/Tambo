<?php

declare(strict_types=1);

namespace App\Models\Platform;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\BelongsToBarangay;

class AiConversation extends Model
{
    use HasFactory, HasUuids, BelongsToBarangay;

    protected $table = 'ai_conversations';

    protected $fillable = [
        'barangay_id',
        'user_id',
        'module_context',
        'messages',
        'tokens_used',
        'credit_cost',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'messages' => 'array',
            'tokens_used' => 'integer',
            'credit_cost' => 'decimal:4',
        ];
    }
}
