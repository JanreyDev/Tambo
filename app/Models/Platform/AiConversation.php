<?php

declare(strict_types=1);

namespace App\Models\Platform;

use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AiConversation extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

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
