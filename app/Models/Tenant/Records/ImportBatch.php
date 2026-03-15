<?php

declare(strict_types=1);

namespace App\Models\Tenant\Records;

use App\Models\Tenant\Resident;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ImportBatch extends Model
{
    use HasUuids;

    protected $table = 'import_batches';

    protected $fillable = [
        'barangay_id',
        'imported_by',
        'filename',
        'total_rows',
        'imported_count',
        'skipped_count',
        'errors',
        'column_mapping',
        'status',
        'rolled_back_at',
        'rolled_back_by',
    ];

    protected function casts(): array
    {
        return [
            'errors' => 'array',
            'column_mapping' => 'array',
            'rolled_back_at' => 'datetime',
        ];
    }

    public function residents(): HasMany
    {
        return $this->hasMany(Resident::class, 'import_batch_id');
    }
}
