<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Message extends Model
{
    use HasUuids, SoftDeletes;

    protected $table = 'messages';

    protected $fillable = [
        'barangay_id',
        'from_user_id',
        'to_user_id',
        'to_address',
        'cc_addresses',
        'subject',
        'body',
        'attachments',
        'folder',
        'is_read',
        'is_starred',
        'is_draft',
        'sent_at',
        'parent_message_id',
    ];

    protected function casts(): array
    {
        return [
            'attachments' => 'array',
            'is_read' => 'boolean',
            'is_starred' => 'boolean',
            'is_draft' => 'boolean',
            'sent_at' => 'datetime',
        ];
    }

    public function fromUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }

    public function toUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'to_user_id');
    }
}
