<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('complaints', function (Blueprint $table) {
            $table->id();
            $table->string('tracking_number')->unique();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->foreignId('department_id')->constrained('departments')->cascadeOnDelete();
            $table->string('title');
            $table->text('description');
            $table->string('image_path')->nullable();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('address')->nullable();
            $table->string('status')->default('Pending'); // 'Pending', 'In Progress', 'Resolved', 'Rejected'
            $table->string('priority')->default('Medium'); // 'Low', 'Medium', 'High', 'Urgent'
            $table->timestamp('sla_deadline')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->string('resolution_image')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('complaints');
    }
};
