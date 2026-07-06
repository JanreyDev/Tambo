<?php

declare(strict_types=1);

namespace App\Models\Founder;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class MabiniConversation extends Model
{
    use HasUuids;

    protected $table = 'mabini_conversations';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'messages',
        'context',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'messages' => 'array',
            'context' => 'array',
        ];
    }

    /**
     * Append a message to the conversation.
     */
    public function addMessage(string $role, string $content): void
    {
        $messages = $this->messages ?? [];
        $messages[] = [
            'role' => $role,
            'content' => $content,
            'timestamp' => now()->toIso8601String(),
        ];
        $this->update(['messages' => $messages]);
    }

    /**
     * Get the most recent conversations.
     */
    public static function recent(int $limit = 10): \Illuminate\Database\Eloquent\Collection
    {
        return static::orderByDesc('updated_at')
            ->limit($limit)
            ->get();
    }
}
