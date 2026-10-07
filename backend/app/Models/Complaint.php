<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class Complaint extends Model
{
    use HasFactory;

    protected $fillable = [
        'tracking_number',
        'user_id',
        'category_id',
        'department_id',
        'title',
        'description',
        'image_path',
        'latitude',
        'longitude',
        'address',
        'status',
        'priority',
        'sla_deadline',
        'resolved_at',
        'resolution_notes',
        'resolution_image',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'sla_deadline' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    protected $appends = ['upvotes_count', 'is_sla_breached', 'image_url', 'resolution_image_url'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(StatusHistory::class)->orderBy('changed_at', 'asc');
    }

    public function upvotes(): HasMany
    {
        return $this->hasMany(Upvote::class);
    }

    public function getUpvotesCountAttribute(): int
    {
        return $this->upvotes()->count();
    }

    public function getIsSlaBreachedAttribute(): bool
    {
        if ($this->status === 'Resolved' || $this->status === 'Rejected') {
            return false;
        }

        if (!$this->sla_deadline) {
            return false;
        }

        return Carbon::now()->greaterThan($this->sla_deadline);
    }

    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image_path) {
            return null;
        }
        if (str_starts_with($this->image_path, 'http')) {
            return $this->image_path;
        }
        return url('storage/' . $this->image_path);
    }

    public function getResolutionImageUrlAttribute(): ?string
    {
        if (!$this->resolution_image) {
            return null;
        }
        if (str_starts_with($this->resolution_image, 'http')) {
            return $this->resolution_image;
        }
        return url('storage/' . $this->resolution_image);
    }
}
