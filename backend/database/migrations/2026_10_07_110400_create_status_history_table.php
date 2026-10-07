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
        Schema::create('status_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('complaint_id')->constrained('complaints')->cascadeOnDelete();
            $table->string('old_status')->nullable();
            $table->string('new_status');
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamp('changed_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('status_history');
    }
};
