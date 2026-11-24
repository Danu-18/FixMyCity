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
        Schema::table('complaints', function (Blueprint $table) {
            $table->string('moderation_status')->default('pending_review')->index()->after('status');
            $table->text('moderation_reason')->nullable()->after('moderation_status');
            $table->foreignId('moderated_by')->nullable()->after('moderation_reason')->constrained('users')->nullOnDelete();
            $table->timestamp('moderated_at')->nullable()->after('moderated_by');
            $table->boolean('is_flagged')->default(false)->after('moderated_at');
            $table->string('flag_reason')->nullable()->after('is_flagged');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('complaints', function (Blueprint $table) {
            if (Schema::hasColumn('complaints', 'moderated_by')) {
                $table->dropForeign(['moderated_by']);
            }
            $table->dropColumn([
                'moderation_status',
                'moderation_reason',
                'moderated_by',
                'moderated_at',
                'is_flagged',
                'flag_reason',
            ]);
        });
    }
};
