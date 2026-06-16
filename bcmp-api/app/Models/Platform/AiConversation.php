<?php

declare(strict_types=1);

namespace App\Models\Platform;

use App\Models\User;
use App\Traits\BelongsToBarangay;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiConversation extends Model
{
    use BelongsToBarangay, HasFactory, HasUuids;

    protected $table = 'ai_conversations';

    protected $fillable = [
        'barangay_id',
        'user_id',
        'title',
        'module_context',
        'messages',
        'tokens_used',
        'input_tokens_used',
        'output_tokens_used',
        'credit_cost',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'messages' => 'array',
            'tokens_used' => 'integer',
            'input_tokens_used' => 'integer',
            'output_tokens_used' => 'integer',
            'credit_cost' => 'decimal:4',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeForUser(Builder $query, string $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    /**
     * Append a message to the conversation's JSONB messages array.
     */
    public function addMessage(string $role, string $content): void
    {
        $messages = $this->messages ?? [];
        $messages[] = [
            'role' => $role,
            'content' => $content,
            'timestamp' => now()->toIso8601String(),
        ];
        $this->messages = $messages;
    }

    /**
     * Convert stored messages to Anthropic Messages API format.
     * Only includes role and content (strips timestamps).
     */
    public function getMessagesForApi(): array
    {
        return collect($this->messages ?? [])
            ->map(fn (array $msg) => [
                'role' => $msg['role'],
                'content' => $msg['content'],
            ])
            ->toArray();
    }

    /**
     * Get the number of messages in this conversation.
     */
    public function getMessageCount(): int
    {
        return count($this->messages ?? []);
    }
}
