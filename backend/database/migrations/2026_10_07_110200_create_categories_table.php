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
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('category_name');
            $table->foreignId('department_id')->constrained('departments')->cascadeOnDelete();
            $table->text('description')->nullable();
            $table->string('default_priority')->default('Medium'); // 'Low', 'Medium', 'High', 'Urgent'
            $table->integer('sla_hours')->default(48);
            $table->string('icon')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
