<?php

namespace Tests\Feature;

use Tests\TestCase;

class RateLimitingTest extends TestCase
{
    public function test_login_throttles_after_five_requests(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $response = $this->postJson('/api/auth/login', [
                'email' => 'test-throttle@fixmycity.org',
                'password' => 'wrongpassword',
            ]);
            $this->assertNotEquals(429, $response->status());
        }

        // 6th attempt must return 429 Too Many Requests
        $response = $this->postJson('/api/auth/login', [
            'email' => 'test-throttle@fixmycity.org',
            'password' => 'wrongpassword',
        ]);
        $response->assertStatus(429);
    }

    public function test_register_throttles_after_five_requests(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $response = $this->postJson('/api/auth/register', [
                'email' => 'test-reg-throttle@fixmycity.org',
            ]);
            $this->assertNotEquals(429, $response->status());
        }

        // 6th attempt must return 429 Too Many Requests
        $response = $this->postJson('/api/auth/register', [
            'email' => 'test-reg-throttle@fixmycity.org',
        ]);
        $response->assertStatus(429);
    }
}
