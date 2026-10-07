<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_name',
        'contact_email',
        'phone',
        'description',
        'sla_hours',
    ];

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function complaints(): HasMany
    {
        return $this->hasMany(Complaint::class);
    }

    public function staff(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
