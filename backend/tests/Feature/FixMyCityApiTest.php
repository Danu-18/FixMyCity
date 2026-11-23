<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Complaint;
use App\Models\Department;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
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

    public function test_pending_authority_signup_with_file_upload(): void
    {
        Storage::fake('local');

        $department = Department::first();
        $this->assertNotNull($department);

        $file = UploadedFile::fake()->create('official_badge.pdf', 1024, 'application/pdf');

        $response = $this->post('/api/register', [
            'name' => 'Officer Bilal Khan',
            'email' => 'bilal.officer@fixmycity.org',
            'password' => 'password123',
            'phone' => '+92 300 7778899',
            'role' => 'authority',
            'department_id' => $department->id,
            'employee_id' => 'EMP-ROADS-999',
            'verification_document' => $file,
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('user.status', 'pending');
        $response->assertJsonPath('token', null);
        $this->assertStringContainsString('pending Super Admin approval', $response->json('message'));

        $user = User::where('email', 'bilal.officer@fixmycity.org')->first();
        $this->assertNotNull($user);
        $this->assertEquals('pending', $user->status);
        $this->assertEquals('EMP-ROADS-999', $user->employee_id);
        $this->assertNotNull($user->verification_document_path);

        Storage::disk('local')->assertExists($user->verification_document_path);
    }

    public function test_cannot_register_as_super_admin_via_public_api(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Fake Super Admin',
            'email' => 'fake.superadmin@fixmycity.org',
            'password' => 'password123',
            'role' => 'super_admin',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['role']);
    }

    public function test_blocked_login_while_pending_and_rejected(): void
    {
        $user = User::create([
            'name' => 'Pending Staff',
            'email' => 'pending.staff@fixmycity.org',
            'password' => Hash::make('password123'),
            'role' => 'authority',
            'status' => 'pending',
            'employee_id' => 'EMP-TEST-001',
        ]);

        // Attempt login while pending
        $loginPending = $this->postJson('/api/login', [
            'email' => 'pending.staff@fixmycity.org',
            'password' => 'password123',
        ]);

        $loginPending->assertStatus(403);
        $this->assertEquals(
            'Your municipal staff account is pending Super Admin approval.',
            $loginPending->json('message')
        );

        // Update status to rejected
        $user->update(['status' => 'rejected']);

        $loginRejected = $this->postJson('/api/login', [
            'email' => 'pending.staff@fixmycity.org',
            'password' => 'password123',
        ]);

        $loginRejected->assertStatus(403);
        $this->assertEquals(
            'Your staff registration request was rejected.',
            $loginRejected->json('message')
        );
    }

    public function test_super_admin_approval_workflow_and_subsequent_login(): void
    {
        Storage::fake('local');

        $department = Department::first();
        $file = UploadedFile::fake()->create('id_doc.png', 500, 'image/png');
        $filePath = $file->store('verifications', 'local');

        $staff = User::create([
            'name' => 'Dr. Kamran Malik',
            'email' => 'kamran.malik@fixmycity.org',
            'password' => Hash::make('password123'),
            'role' => 'authority',
            'status' => 'pending',
            'department_id' => $department->id,
            'employee_id' => 'EMP-HLTH-777',
            'verification_document_path' => $filePath,
        ]);

        // 1. Super Admin logs in
        $superAdminLogin = $this->postJson('/api/login', [
            'email' => 'superadmin@fixmycity.org',
            'password' => 'password123',
        ]);

        $superAdminLogin->assertStatus(200);
        $this->assertEquals('super_admin', $superAdminLogin->json('user.role'));
        $superAdminToken = $superAdminLogin->json('token');

        // 2. Super Admin views pending staff list
        $pendingResp = $this->withHeader('Authorization', "Bearer {$superAdminToken}")
            ->getJson('/api/super-admin/pending-staff');

        $pendingResp->assertStatus(200);
        $pendingResp->assertJsonFragment([
            'email' => 'kamran.malik@fixmycity.org',
            'employee_id' => 'EMP-HLTH-777',
            'status' => 'pending',
        ]);

        // 3. Super Admin inspects document
        $docResp = $this->withHeader('Authorization', "Bearer {$superAdminToken}")
            ->get("/api/super-admin/staff/{$staff->id}/document");

        $docResp->assertStatus(200);

        // 4. Super Admin approves staff
        $approveResp = $this->withHeader('Authorization', "Bearer {$superAdminToken}")
            ->postJson("/api/super-admin/staff/{$staff->id}/approve");

        $approveResp->assertStatus(200);
        $this->assertEquals('active', $approveResp->json('user.status'));
        $this->assertNotNull($approveResp->json('user.approved_at'));

        // Verify in DB
        $staff->refresh();
        $this->assertEquals('active', $staff->status);
        $this->assertNotNull($staff->approved_at);
        $this->assertNotNull($staff->approved_by);

        // 5. Staff logs in successfully after approval
        $staffLogin = $this->postJson('/api/login', [
            'email' => 'kamran.malik@fixmycity.org',
            'password' => 'password123',
        ]);

        $staffLogin->assertStatus(200);
        $staffLogin->assertJsonStructure(['token', 'user']);
        $this->assertEquals('active', $staffLogin->json('user.status'));
    }

    public function test_super_admin_can_reject_staff_and_login_is_blocked(): void
    {
        $staff = User::create([
            'name' => 'Rejected Staff',
            'email' => 'rejected.staff@fixmycity.org',
            'password' => Hash::make('password123'),
            'role' => 'authority',
            'status' => 'pending',
            'employee_id' => 'EMP-REJ-001',
        ]);

        // Super Admin logs in
        $superAdminLogin = $this->postJson('/api/login', [
            'email' => 'superadmin@fixmycity.org',
            'password' => 'password123',
        ]);
        $superAdminToken = $superAdminLogin->json('token');

        // Super Admin rejects staff
        $rejectResp = $this->withHeader('Authorization', "Bearer {$superAdminToken}")
            ->postJson("/api/super-admin/staff/{$staff->id}/reject");

        $rejectResp->assertStatus(200);
        $this->assertEquals('rejected', $rejectResp->json('user.status'));

        // Staff tries to log in
        $staffLogin = $this->postJson('/api/login', [
            'email' => 'rejected.staff@fixmycity.org',
            'password' => 'password123',
        ]);

        $staffLogin->assertStatus(403);
        $this->assertEquals(
            'Your staff registration request was rejected.',
            $staffLogin->json('message')
        );
    }
}
