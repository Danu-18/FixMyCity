<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'superadmin@fixmycity.org'],
            [
                'name' => 'Super Administrator',
                'password' => Hash::make('password123'),
                'role' => 'super_admin',
                'status' => 'active',
                'city' => 'Islamabad',
                'phone' => '+92 300 9999999',
                'email_verified_at' => now(),
            ]
        );

        // Ensure any existing users have status 'active' if not set
        User::whereNull('status')->update(['status' => 'active']);
    }
}
