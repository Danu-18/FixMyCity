<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StatusHistory extends Model
{
    use HasFactory;

    protected $table = 'status_history';

    protected $fillable = [
        'complaint_id',
        'old_status',
        'new_status',
        'changed_by',
        'notes',
        'changed_at',
    ];

    protected $casts = [
        'changed_at' => 'datetime',
    ];

    public function complaint(): BelongsTo
    {
        return $this->belongsTo(Complaint::class);
    }

    public function changer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
