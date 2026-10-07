<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Complaint;
use App\Models\Department;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FixMyCityApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate');
        $this->artisan('db:seed');
    }
    public function test_departments_and_categories_endpoints_return_data(): void
    {
        $response = $this->getJson('/api/departments');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            '*' => ['id', 'department_name', 'contact_email', 'sla_hours', 'total_complaints'],
        ]);

        $catResponse = $this->getJson('/api/categories');
        $catResponse->assertStatus(200);
        $catResponse->assertJsonStructure([
            '*' => ['id', 'category_name', 'department_id', 'sla_hours'],
        ]);
    }

    public function test_auth_login_and_me_endpoint(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'citizen@fixmycity.org',
            'password' => 'password123',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure(['token', 'user']);

        $token = $response->json('token');

        $meResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/me');

        $meResponse->assertStatus(200)
            ->assertJsonPath('user.email', 'citizen@fixmycity.org');
    }

    public function test_automated_complaint_routing_to_department(): void
    {
        $category = Category::where('category_name', 'Damaged Road / Pothole')->first();
        $this->assertNotNull($category);

        $submitResponse = $this->postJson('/api/complaints', [
            'title' => 'Test Road Damage on Clifton Expressway',
            'description' => 'Massive ditch opened up in middle lane.',
            'category_id' => $category->id,
            'latitude' => 24.814,
            'longitude' => 67.032,
            'address' => 'Clifton Expressway, Karachi',
            'priority' => 'High',
        ]);

        $submitResponse->assertStatus(201);
        $complaintData = $submitResponse->json('complaint');

        $this->assertEquals($category->department_id, $complaintData['department_id']);
        $this->assertEquals('Pending', $complaintData['status']);
        $this->assertNotNull($complaintData['sla_deadline']);
        $this->assertStringStartsWith('FMC-', $complaintData['tracking_number']);
    }

    public function test_authority_status_transition_workflow(): void
    {
        // Login as roads authority
        $login = $this->postJson('/api/auth/login', [
            'email' => 'roads@fixmycity.org',
            'password' => 'password123',
        ]);
        $token = $login->json('token');

        $complaint = Complaint::where('status', 'Pending')->first();
        $this->assertNotNull($complaint);

        // Transition to In Progress
        $updateResp = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/complaints/{$complaint->id}/status", [
                'status' => 'In Progress',
                'notes' => 'Dispatched engineering crew to location.',
            ]);

        $updateResp->assertStatus(200);
        $this->assertEquals('In Progress', $updateResp->json('complaint.status'));
    }

    public function test_heatmap_and_analytics_endpoints(): void
    {
        $heatmapResp = $this->getJson('/api/heatmap');
        $heatmapResp->assertStatus(200);
        $heatmapResp->assertJsonStructure(['total', 'points']);

        $analyticsResp = $this->getJson('/api/analytics/overview');
        $analyticsResp->assertStatus(200);
        $analyticsResp->assertJsonStructure([
            'summary' => [
                'total_complaints',
                'pending',
                'in_progress',
                'resolved',
                'sla_compliance_rate',
            ],
            'departments',
            'categories',
        ]);
    }
}
