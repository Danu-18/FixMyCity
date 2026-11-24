<?php

namespace Tests\Feature;

use App\Mail\CitizenVerificationCodeMail;
use App\Mail\ComplaintLifecycleMail;
use App\Models\Category;
use App\Models\Complaint;
use App\Models\Department;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FixMyCityApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        $this->withoutMiddleware([\Illuminate\Routing\Middleware\ThrottleRequests::class]);
        $this->artisan('migrate');
        $this->artisan('db:seed');
    }

    protected function createFakeImage(string $name = 'incident.png'): UploadedFile
    {
        $onePixelPng = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
        return UploadedFile::fake()->createWithContent($name, $onePixelPng);
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
        Storage::fake('public');
        $category = Category::where('category_name', 'Damaged Road / Pothole')->first();
        $this->assertNotNull($category);

        $file = $this->createFakeImage('road_damage.png');

        $submitResponse = $this->post('/api/complaints', [
            'title' => 'Test Road Damage on Clifton Expressway',
            'description' => 'Massive ditch opened up in middle lane.',
            'category_id' => $category->id,
            'city' => 'Karachi',
            'latitude' => 24.814,
            'longitude' => 67.032,
            'address' => 'Clifton Expressway, Karachi',
            'priority' => 'High',
            'image' => $file,
        ], ['Accept' => 'application/json']);

        $submitResponse->assertStatus(201);
        $complaintData = $submitResponse->json('complaint');

        $this->assertEquals($category->department_id, $complaintData['department_id']);
        $this->assertEquals('Pending', $complaintData['status']);
        $this->assertEquals('pending_review', $complaintData['moderation_status']);
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
            'city' => 'Karachi',
            'role' => 'authority',
            'department_id' => $department->id,
            'verification_document' => $file,
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('user.status', 'pending');
        $response->assertJsonPath('user.city', 'Karachi');
        $response->assertJsonPath('token', null);
        $this->assertStringContainsString('pending Super Admin approval', $response->json('message'));

        $user = User::where('email', 'bilal.officer@fixmycity.org')->first();
        $this->assertNotNull($user);
        $this->assertEquals('pending', $user->status);
        $this->assertEquals('Karachi', $user->city);
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

    public function test_authority_city_jurisdiction_scoping_and_cross_city_isolation(): void
    {
        // 1. Login as Karachi Roads Authority (roads@fixmycity.org)
        $karachiLogin = $this->postJson('/api/auth/login', [
            'email' => 'roads@fixmycity.org',
            'password' => 'password123',
        ]);
        $karachiLogin->assertStatus(200);
        $karachiToken = $karachiLogin->json('token');

        // Fetch authority's complaint queue
        $karachiQueue = $this->withHeader('Authorization', "Bearer {$karachiToken}")
            ->getJson('/api/complaints');

        $karachiQueue->assertStatus(200);
        $karachiComplaints = $karachiQueue->json('data');

        // Verify that all returned complaints belong to Karachi jurisdiction
        $this->assertNotEmpty($karachiComplaints);
        foreach ($karachiComplaints as $c) {
            $this->assertEquals('Karachi', $c['city']);
            $this->assertEquals($karachiLogin->json('user.department_id'), $c['department_id']);
        }

        // Verify that Lahore road complaints are NOT in Karachi's queue
        $lahoreComplaint = Complaint::where('city', 'Lahore')->first();
        $this->assertNotNull($lahoreComplaint);

        $karachiComplaintIds = collect($karachiComplaints)->pluck('id')->all();
        $this->assertNotContains($lahoreComplaint->id, $karachiComplaintIds);

        // 2. Attempt to update Lahore complaint using Karachi authority token -> 403 Forbidden
        $forbiddenUpdate = $this->withHeader('Authorization', "Bearer {$karachiToken}")
            ->patchJson("/api/complaints/{$lahoreComplaint->id}/status", [
                'status' => 'In Progress',
                'notes' => 'Attempting unauthorized cross-city update.',
            ]);

        $forbiddenUpdate->assertStatus(403);
        $this->assertStringContainsString('city jurisdiction', $forbiddenUpdate->json('message'));

        // 3. Login as Lahore Roads Authority (roads.lahore@fixmycity.org)
        app('auth')->forgetGuards();
        $lahoreLogin = $this->postJson('/api/auth/login', [
            'email' => 'roads.lahore@fixmycity.org',
            'password' => 'password123',
        ]);
        $lahoreLogin->assertStatus(200);
        $lahoreToken = $lahoreLogin->json('token');

        // Fetch Lahore authority's complaint queue
        app('auth')->forgetGuards();
        $lahoreQueue = $this->withHeader('Authorization', "Bearer {$lahoreToken}")
            ->getJson('/api/complaints');

        $lahoreQueue->assertStatus(200);
        $lahoreComplaints = $lahoreQueue->json('data');

        // Verify Lahore sees Lahore complaints and no Karachi complaints
        $this->assertNotEmpty($lahoreComplaints);
        foreach ($lahoreComplaints as $c) {
            $this->assertEquals('Lahore', $c['city']);
            $this->assertEquals($lahoreLogin->json('user.department_id'), $c['department_id']);
        }

        // 4. Lahore authority CAN successfully update the Lahore complaint
        $lahoreUpdate = $this->withHeader('Authorization', "Bearer {$lahoreToken}")
            ->patchJson("/api/complaints/{$lahoreComplaint->id}/status", [
                'status' => 'In Progress',
                'notes' => 'Dispatched Lahore municipal team.',
            ]);

        $lahoreUpdate->assertStatus(200);
        $this->assertEquals('In Progress', $lahoreUpdate->json('complaint.status'));
    }

    public function test_super_admin_and_public_can_filter_by_city(): void
    {
        // Public heatmap without filter returns all points
        $allHeatmap = $this->getJson('/api/heatmap');
        $allHeatmap->assertStatus(200);
        $totalAll = $allHeatmap->json('total');

        // Public heatmap with ?city=Karachi
        $karachiHeatmap = $this->getJson('/api/heatmap?city=Karachi');
        $karachiHeatmap->assertStatus(200);
        $this->assertGreaterThan(0, $karachiHeatmap->json('total'));
        foreach ($karachiHeatmap->json('points') as $point) {
            $this->assertEquals('Karachi', $point['city']);
        }

        // Public heatmap with ?city=Lahore
        $lahoreHeatmap = $this->getJson('/api/heatmap?city=Lahore');
        $lahoreHeatmap->assertStatus(200);
        $this->assertEquals(1, $lahoreHeatmap->json('total'));
        $this->assertEquals('Lahore', $lahoreHeatmap->json('points.0.city'));

        $this->assertEquals($totalAll, $karachiHeatmap->json('total') + $lahoreHeatmap->json('total'));
    }

    public function test_content_moderation_blocks_profanity_and_spam(): void
    {
        Storage::fake('public');
        $category = Category::first();
        $file = $this->createFakeImage('proof.png');

        // 1. English profanity
        $profaneResp = $this->post('/api/complaints', [
            'title' => 'Fix this fuck road immediately',
            'description' => 'The entire street is ruined and you people are doing nothing.',
            'category_id' => $category->id,
            'city' => 'Karachi',
            'latitude' => 24.86,
            'longitude' => 67.00,
            'image' => $file,
        ], ['Accept' => 'application/json']);
        $profaneResp->assertStatus(422);
        $this->assertStringContainsString('inappropriate language', $profaneResp->json('message'));

        // 2. Obfuscated Roman Urdu slur
        $obfuscatedResp = $this->post('/api/complaints', [
            'title' => 'Pothole issue on main boulevard',
            'description' => 'Ye sub k.a.m.i.n.a log hain koi kaam nahi karta yahan.',
            'category_id' => $category->id,
            'city' => 'Karachi',
            'latitude' => 24.86,
            'longitude' => 67.00,
            'image' => $file,
        ], ['Accept' => 'application/json']);
        $obfuscatedResp->assertStatus(422);
        $this->assertStringContainsString('inappropriate language', $obfuscatedResp->json('message'));

        // 3. Spam / Repeated characters
        $spamResp = $this->post('/api/complaints', [
            'title' => 'aaaaaaa',
            'description' => 'aaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            'category_id' => $category->id,
            'city' => 'Karachi',
            'latitude' => 24.86,
            'longitude' => 67.00,
            'image' => $file,
        ], ['Accept' => 'application/json']);
        $spamResp->assertStatus(422);
        $this->assertStringContainsString('inappropriate language or invalid text', $spamResp->json('message'));

        // 4. Gibberish / Mashed keys
        $gibberishResp = $this->post('/api/complaints', [
            'title' => 'zxvbnm',
            'description' => 'qwrtypsdfghjklzxcvbnm test',
            'category_id' => $category->id,
            'city' => 'Karachi',
            'latitude' => 24.86,
            'longitude' => 67.00,
            'image' => $file,
        ], ['Accept' => 'application/json']);
        $gibberishResp->assertStatus(422);
    }

    public function test_clean_complaint_lands_in_pending_review_and_is_hidden_from_public_and_authority(): void
    {
        Storage::fake('public');
        $citizen = User::where('role', 'citizen')->first();
        $this->assertNotNull($citizen);

        $citizenLogin = $this->postJson('/api/auth/login', [
            'email' => $citizen->email,
            'password' => 'password123',
        ]);
        $citizenToken = $citizenLogin->json('token');

        $category = Category::first();
        $file = $this->createFakeImage('pipe_burst.png');

        // 1. Citizen submits valid clean complaint with image
        $submitResp = $this->withHeader('Authorization', "Bearer {$citizenToken}")
            ->post('/api/complaints', [
                'title' => 'Broken Water Pipe Flooding Gulberg Main Road',
                'description' => 'Fresh water is gushing out continuously and flooding the road near Block 3.',
                'category_id' => $category->id,
                'city' => 'Karachi',
                'latitude' => 24.912,
                'longitude' => 67.078,
                'image' => $file,
            ], ['Accept' => 'application/json']);

        $submitResp->assertStatus(201);
        $complaintId = $submitResp->json('complaint.id');
        $trackingNum = $submitResp->json('complaint.tracking_number');
        $this->assertEquals('pending_review', $submitResp->json('complaint.moderation_status'));

        // 2. Complaint is hidden from public /api/complaints
        $publicList = $this->getJson('/api/complaints');
        $publicList->assertStatus(200);
        $publicIds = collect($publicList->json('data'))->pluck('id')->all();
        $this->assertNotContains($complaintId, $publicIds);

        // 3. Complaint is hidden from public /api/heatmap
        $heatmap = $this->getJson('/api/heatmap');
        $heatmap->assertStatus(200);
        $heatmapIds = collect($heatmap->json('points'))->pluck('id')->all();
        $this->assertNotContains($complaintId, $heatmapIds);

        // 4. Complaint is hidden from Authority action queue
        $authLogin = $this->postJson('/api/auth/login', [
            'email' => 'roads@fixmycity.org',
            'password' => 'password123',
        ]);
        $authQueue = $this->withHeader('Authorization', "Bearer {$authLogin->json('token')}")
            ->getJson('/api/complaints');
        $authQueueIds = collect($authQueue->json('data'))->pluck('id')->all();
        $this->assertNotContains($complaintId, $authQueueIds);

        // 5. But submitting citizen CAN see it on personal dashboard (?mine=true)
        $citizenQueue = $this->withHeader('Authorization', "Bearer {$citizenToken}")
            ->getJson('/api/complaints?mine=true');
        $citizenQueueIds = collect($citizenQueue->json('data'))->pluck('id')->all();
        $this->assertContains($complaintId, $citizenQueueIds);

        // 6. Direct lookup by tracking number is accessible
        $trackingResp = $this->getJson("/api/complaints/{$trackingNum}");
        $trackingResp->assertStatus(200);
        $this->assertEquals($complaintId, $trackingResp->json('id'));
    }

    public function test_super_admin_moderation_queue_and_approval_workflow(): void
    {
        Storage::fake('public');
        $category = Category::where('category_name', 'Damaged Road / Pothole')->first();
        $file = $this->createFakeImage('pothole.png');

        // 1. Submit a complaint that lands in pending_review
        $submit = $this->post('/api/complaints', [
            'title' => 'Deep pothole outside school gate in Karachi',
            'description' => 'Children are at danger due to this severe trench outside the main campus.',
            'category_id' => $category->id,
            'city' => 'Karachi',
            'latitude' => 24.85,
            'longitude' => 67.02,
            'image' => $file,
        ], ['Accept' => 'application/json']);
        $submit->assertStatus(201);
        $complaintId = $submit->json('complaint.id');

        // 2. Super Admin logs in
        $superAdminLogin = $this->postJson('/api/login', [
            'email' => 'superadmin@fixmycity.org',
            'password' => 'password123',
        ]);
        $superAdminToken = $superAdminLogin->json('token');

        // 3. Super Admin checks moderation queue
        $queueResp = $this->withHeader('Authorization', "Bearer {$superAdminToken}")
            ->getJson('/api/super-admin/moderation-queue');
        $queueResp->assertStatus(200);
        $queueIds = collect($queueResp->json())->pluck('id')->all();
        $this->assertContains($complaintId, $queueIds);

        // 4. Super Admin approves complaint
        $approveResp = $this->withHeader('Authorization', "Bearer {$superAdminToken}")
            ->postJson("/api/super-admin/complaints/{$complaintId}/approve");
        $approveResp->assertStatus(200);
        $this->assertEquals('approved', $approveResp->json('complaint.moderation_status'));
        $this->assertNotNull($approveResp->json('complaint.moderated_at'));

        // 5. Complaint is now visible in public listing and authority queue
        $publicList = $this->getJson('/api/complaints');
        $publicIds = collect($publicList->json('data'))->pluck('id')->all();
        $this->assertContains($complaintId, $publicIds);

        $roadsLogin = $this->postJson('/api/auth/login', [
            'email' => 'roads@fixmycity.org',
            'password' => 'password123',
        ]);
        $roadsQueue = $this->withHeader('Authorization', "Bearer {$roadsLogin->json('token')}")
            ->getJson('/api/complaints');
        $roadsIds = collect($roadsQueue->json('data'))->pluck('id')->all();
        $this->assertContains($complaintId, $roadsIds);
    }

    public function test_super_admin_rejects_complaint_with_reason(): void
    {
        Storage::fake('public');
        $category = Category::first();
        $file = $this->createFakeImage('unauthorized_vehicle.png');

        // 1. Submit a complaint
        $submit = $this->post('/api/complaints', [
            'title' => 'Suspicious vehicle parked on sidewalk for two weeks',
            'description' => 'Unidentified car blocking the pedestrian walkway continuously.',
            'category_id' => $category->id,
            'city' => 'Karachi',
            'latitude' => 24.85,
            'longitude' => 67.02,
            'image' => $file,
        ], ['Accept' => 'application/json']);
        $submit->assertStatus(201);
        $complaintId = $submit->json('complaint.id');

        // 2. Super Admin logs in
        $superAdminLogin = $this->postJson('/api/login', [
            'email' => 'superadmin@fixmycity.org',
            'password' => 'password123',
        ]);
        $superAdminToken = $superAdminLogin->json('token');

        // 3. Rejection requires min 5 characters reason
        $shortReason = $this->withHeader('Authorization', "Bearer {$superAdminToken}")
            ->postJson("/api/super-admin/complaints/{$complaintId}/reject", [
                'reason' => 'bad',
            ]);
        $shortReason->assertStatus(422);

        // 4. Valid rejection
        $validReject = $this->withHeader('Authorization', "Bearer {$superAdminToken}")
            ->postJson("/api/super-admin/complaints/{$complaintId}/reject", [
                'reason' => 'Issue pertains to vehicle theft which falls under police jurisdiction rather than municipal.',
            ]);
        $validReject->assertStatus(200);
        $this->assertEquals('rejected', $validReject->json('complaint.moderation_status'));
        $this->assertStringContainsString('police jurisdiction', $validReject->json('complaint.moderation_reason'));

        // 5. Remains hidden from public
        $publicList = $this->getJson('/api/complaints');
        $publicIds = collect($publicList->json('data'))->pluck('id')->all();
        $this->assertNotContains($complaintId, $publicIds);
    }

    public function test_citizen_can_flag_approved_complaint_and_it_enters_moderation_queue(): void
    {
        // 1. Get an approved complaint
        $approvedComplaint = Complaint::where('moderation_status', 'approved')->first();
        $this->assertNotNull($approvedComplaint);

        // 2. Citizen logs in
        $citizenLogin = $this->postJson('/api/auth/login', [
            'email' => 'citizen@fixmycity.org',
            'password' => 'password123',
        ]);
        $citizenToken = $citizenLogin->json('token');

        // 3. Citizen flags the complaint
        $flagResp = $this->withHeader('Authorization', "Bearer {$citizenToken}")
            ->postJson("/api/complaints/{$approvedComplaint->id}/flag", [
                'reason' => 'Image contains inappropriate graffiti not related to municipal issue.',
            ]);
        $flagResp->assertStatus(200);
        $this->assertTrue($flagResp->json('complaint.is_flagged'));
        $this->assertEquals('Image contains inappropriate graffiti not related to municipal issue.', $flagResp->json('complaint.flag_reason'));

        // 4. Super Admin moderation queue contains this flagged complaint
        app('auth')->forgetGuards();
        $superAdminLogin = $this->postJson('/api/login', [
            'email' => 'superadmin@fixmycity.org',
            'password' => 'password123',
        ]);
        app('auth')->forgetGuards();
        $modQueue = $this->withHeader('Authorization', "Bearer {$superAdminLogin->json('token')}")
            ->getJson('/api/super-admin/moderation-queue');
        $modQueue->assertStatus(200);
        $modQueueIds = collect($modQueue->json())->pluck('id')->all();
        $this->assertContains($approvedComplaint->id, $modQueueIds);
    }

    public function test_super_admin_cannot_operationally_update_complaint_status_but_authority_can(): void
    {
        // 1. Get an approved complaint for Roads department in Karachi
        $complaint = Complaint::where('moderation_status', 'approved')
            ->where('status', 'Pending')
            ->first();
        $this->assertNotNull($complaint);

        // 2. Super Admin logs in
        $superAdminLogin = $this->postJson('/api/login', [
            'email' => 'superadmin@fixmycity.org',
            'password' => 'password123',
        ]);
        $superAdminToken = $superAdminLogin->json('token');

        // 3. Super Admin attempts operational status update -> must be blocked with 403
        $superAdminUpdate = $this->withHeader('Authorization', "Bearer {$superAdminToken}")
            ->patchJson("/api/complaints/{$complaint->id}/status", [
                'status' => 'In Progress',
                'notes' => 'Super admin trying to mark complaint in progress.',
            ]);

        $superAdminUpdate->assertStatus(403);
        $this->assertEquals(
            'Super Administrators moderate complaint authenticity only. Operational resolution is restricted to the assigned municipal department.',
            $superAdminUpdate->json('message')
        );

        // 4. Authority logs in (matching department and city)
        app('auth')->forgetGuards();
        $authorityUser = User::where('role', 'authority')
            ->where('department_id', $complaint->department_id)
            ->whereIn('status', ['active', 'approved'])
            ->first();
        $this->assertNotNull($authorityUser);

        $authorityLogin = $this->postJson('/api/auth/login', [
            'email' => $authorityUser->email,
            'password' => 'password123',
        ]);
        $authorityToken = $authorityLogin->json('token');

        // 5. Authority successfully updates status to In Progress
        app('auth')->forgetGuards();
        $authorityUpdate = $this->withHeader('Authorization', "Bearer {$authorityToken}")
            ->patchJson("/api/complaints/{$complaint->id}/status", [
                'status' => 'In Progress',
                'notes' => 'Dispatched engineering crew to fix issue.',
            ]);

        $authorityUpdate->assertStatus(200);
        $this->assertEquals('In Progress', $authorityUpdate->json('complaint.status'));

        // 6. Authority resolves complaint
        app('auth')->forgetGuards();
        $resolveUpdate = $this->withHeader('Authorization', "Bearer {$authorityToken}")
            ->patchJson("/api/complaints/{$complaint->id}/status", [
                'status' => 'Resolved',
                'notes' => 'Pothole permanently patched with asphalt.',
            ]);

        $resolveUpdate->assertStatus(200);
        $this->assertEquals('Resolved', $resolveUpdate->json('complaint.status'));
    }

    public function test_complaint_cannot_be_submitted_without_image_upload(): void
    {
        $category = Category::first();
        $this->assertNotNull($category);

        $response = $this->postJson('/api/complaints', [
            'title' => 'Open Drain on Shahrah-e-Faisal',
            'description' => 'A large stormwater drain is missing its grate creating hazard.',
            'category_id' => $category->id,
            'city' => 'Karachi',
            'latitude' => 24.87,
            'longitude' => 67.06,
            'priority' => 'High',
            // No image provided
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['image']);
        $this->assertEquals('The image field is required.', $response->json('errors.image.0'));
    }

    public function test_citizen_signup_sends_otp_and_returns_requires_verification_with_no_token(): void
    {
        $email = 'newcitizen@example.com';
        $response = $this->postJson('/api/register', [
            'name' => 'New Citizen',
            'email' => $email,
            'password' => 'secret12345',
            'phone' => '+92 300 1122334',
            'city' => 'Lahore',
            'role' => 'citizen',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('requires_verification', true);
        $response->assertJsonPath('email', $email);
        $response->assertJsonMissing(['token']);
        $this->assertNull($response->json('token'));

        $user = User::where('email', $email)->first();
        $this->assertNotNull($user);
        $this->assertEquals('citizen', $user->role);
        $this->assertNull($user->email_verified_at);
        $this->assertNotNull($user->email_verification_code);
        $this->assertNotNull($user->email_verification_expires_at);

        Mail::assertSent(CitizenVerificationCodeMail::class, function ($mail) use ($email) {
            return $mail->hasTo($email);
        });
    }

    public function test_unverified_citizen_login_is_blocked_with_403(): void
    {
        $user = User::create([
            'name' => 'Unverified Citizen',
            'email' => 'unverified@example.com',
            'password' => Hash::make('password123'),
            'role' => 'citizen',
            'status' => 'active',
            'email_verified_at' => null,
            'email_verification_code' => Hash::make('123456'),
            'email_verification_expires_at' => now()->addMinutes(15),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'unverified@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(403);
        $response->assertJsonPath('requires_verification', true);
        $response->assertJsonPath('email', 'unverified@example.com');
        $this->assertStringContainsString('verify your email address', $response->json('message'));
    }

    public function test_wrong_or_expired_otp_is_rejected(): void
    {
        $user = User::create([
            'name' => 'OTP Test User',
            'email' => 'otptest@example.com',
            'password' => Hash::make('password123'),
            'role' => 'citizen',
            'status' => 'active',
            'email_verified_at' => null,
            'email_verification_code' => Hash::make('654321'),
            'email_verification_expires_at' => now()->addMinutes(15),
        ]);

        // Wrong OTP code
        $wrongResponse = $this->postJson('/api/email/verify', [
            'email' => 'otptest@example.com',
            'code' => '999999',
        ]);

        $wrongResponse->assertStatus(422);
        $this->assertEquals('Invalid or expired verification code.', $wrongResponse->json('message'));
        $this->assertNull($user->fresh()->email_verified_at);

        // Expired OTP code
        $user->update([
            'email_verification_expires_at' => now()->subMinute(),
        ]);

        $expiredResponse = $this->postJson('/api/email/verify', [
            'email' => 'otptest@example.com',
            'code' => '654321',
        ]);

        $expiredResponse->assertStatus(422);
        $this->assertEquals('Invalid or expired verification code.', $expiredResponse->json('message'));
        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_valid_otp_verifies_account_and_issues_auth_token(): void
    {
        $user = User::create([
            'name' => 'Valid OTP User',
            'email' => 'validotp@example.com',
            'password' => Hash::make('password123'),
            'role' => 'citizen',
            'status' => 'active',
            'email_verified_at' => null,
            'email_verification_code' => Hash::make('456789'),
            'email_verification_expires_at' => now()->addMinutes(15),
        ]);

        $response = $this->postJson('/api/email/verify', [
            'email' => 'validotp@example.com',
            'code' => '456789',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure(['message', 'user', 'token']);
        $this->assertNotEmpty($response->json('token'));
        $this->assertEquals('validotp@example.com', $response->json('user.email'));

        $freshUser = $user->fresh();
        $this->assertNotNull($freshUser->email_verified_at);
        $this->assertNull($freshUser->email_verification_code);
        $this->assertNull($freshUser->email_verification_expires_at);

        // Now user can log in without issue
        $loginResponse = $this->postJson('/api/login', [
            'email' => 'validotp@example.com',
            'password' => 'password123',
        ]);

        $loginResponse->assertStatus(200);
        $this->assertNotEmpty($loginResponse->json('token'));
    }

    public function test_resend_otp_generates_fresh_code_and_dispatches_email(): void
    {
        $user = User::create([
            'name' => 'Resend OTP User',
            'email' => 'resendotp@example.com',
            'password' => Hash::make('password123'),
            'role' => 'citizen',
            'status' => 'active',
            'email_verified_at' => null,
            'email_verification_code' => Hash::make('111111'),
            'email_verification_expires_at' => now()->subMinute(), // expired old code
        ]);

        $response = $this->postJson('/api/email/resend', [
            'email' => 'resendotp@example.com',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('requires_verification', true);
        $response->assertJsonPath('email', 'resendotp@example.com');
        $this->assertStringContainsString('fresh 6-digit verification code', $response->json('message'));

        $freshUser = $user->fresh();
        $this->assertNotNull($freshUser->email_verification_code);
        $this->assertFalse(Hash::check('111111', $freshUser->email_verification_code));
        $this->assertTrue(now()->isBefore($freshUser->email_verification_expires_at));

        Mail::assertSent(CitizenVerificationCodeMail::class, function ($mail) {
            return $mail->hasTo('resendotp@example.com');
        });
    }

    public function test_filing_complaint_notifies_citizen_a_and_super_admin_while_citizen_b_gets_zero_notifications(): void
    {
        $citizenA = User::create([
            'name' => 'Citizen Alpha',
            'email' => 'citizen.alpha@fixmycity.org',
            'password' => Hash::make('password123'),
            'role' => 'citizen',
            'status' => 'active',
            'city' => 'Karachi',
            'email_verified_at' => now(),
        ]);

        $citizenB = User::create([
            'name' => 'Citizen Beta',
            'email' => 'citizen.beta@fixmycity.org',
            'password' => Hash::make('password123'),
            'role' => 'citizen',
            'status' => 'active',
            'city' => 'Lahore',
            'email_verified_at' => now(),
        ]);

        $category = Category::first();
        $this->assertNotNull($category);

        $tokenA = $citizenA->createToken('test')->plainTextToken;
        $response = $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->post('/api/complaints', [
                'title' => 'Severe Water Pipe Burst on Main Road',
                'description' => 'A large main pipe has ruptured causing severe flooding on the roadway.',
                'category_id' => $category->id,
                'city' => 'Karachi',
                'latitude' => 24.88,
                'longitude' => 67.08,
                'image' => $this->createFakeImage('rupture.png'),
            ]);

        $response->assertStatus(201);
        $complaintId = $response->json('complaint.id');
        $this->assertNotNull($complaintId);

        // Assert ComplaintLifecycleMail sent to Citizen A
        Mail::assertSent(ComplaintLifecycleMail::class, function ($mail) use ($citizenA) {
            return $mail->hasTo($citizenA->email) && $mail->stage === 'submitted';
        });

        // Assert DB notification created for Citizen A
        $notifA = Notification::where('user_id', $citizenA->id)->where('complaint_id', $complaintId)->first();
        $this->assertNotNull($notifA);
        $this->assertEquals('complaint_submitted', $notifA->type);

        // Assert Super Admin received a moderation review notification
        $superAdmin = User::where('role', 'super_admin')->first();
        $this->assertTrue(Notification::where('user_id', $superAdmin->id)->where('complaint_id', $complaintId)->exists());

        // Assert Citizen B receives ZERO notifications for Citizen A's complaint
        app('auth')->forgetGuards();
        $tokenB = $citizenB->createToken('test')->plainTextToken;
        $notifsResponseB = $this->withHeader('Authorization', "Bearer {$tokenB}")->getJson('/api/notifications');
        $notifsResponseB->assertStatus(200);
        $complaintIdsB = collect($notifsResponseB->json('notifications.data'))->pluck('complaint_id')->toArray();
        $this->assertNotContains($complaintId, $complaintIdsB);
    }

    public function test_citizen_b_cannot_mark_citizen_a_notification_as_read_with_403_forbidden(): void
    {
        $citizenA = User::create([
            'name' => 'Owner Citizen',
            'email' => 'owner@fixmycity.org',
            'password' => Hash::make('password123'),
            'role' => 'citizen',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        $citizenB = User::create([
            'name' => 'Attacker Citizen',
            'email' => 'attacker@fixmycity.org',
            'password' => Hash::make('password123'),
            'role' => 'citizen',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        $notifA = Notification::create([
            'user_id' => $citizenA->id,
            'title' => 'Your Private Notification',
            'message' => 'Confidential details about your complaint.',
            'type' => 'status_change',
            'is_read' => false,
        ]);

        $tokenA = $citizenA->createToken('test')->plainTextToken;
        $tokenB = $citizenB->createToken('test')->plainTextToken;

        // Citizen B attempts to mark Citizen A's notification as read -> 403 Forbidden
        app('auth')->forgetGuards();
        $responseB = $this->withHeader('Authorization', "Bearer {$tokenB}")
            ->patchJson("/api/notifications/{$notifA->id}/read");

        $responseB->assertStatus(403);
        $this->assertFalse($notifA->fresh()->is_read);

        // Citizen A marks their own notification as read -> 200 OK
        app('auth')->forgetGuards();
        $responseA = $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->patchJson("/api/notifications/{$notifA->id}/read");

        $responseA->assertStatus(200);
        $this->assertTrue($notifA->fresh()->is_read);
    }

    public function test_super_admin_approval_sends_email_to_citizen_and_notifies_matching_authority_only(): void
    {
        $citizen = User::create([
            'name' => 'Approvee Citizen',
            'email' => 'approvee@fixmycity.org',
            'password' => Hash::make('password123'),
            'role' => 'citizen',
            'status' => 'active',
            'city' => 'Karachi',
            'email_verified_at' => now(),
        ]);

        $category = Category::first();
        $complaint = Complaint::create([
            'tracking_number' => 'FMC-2026-APPRV',
            'user_id' => $citizen->id,
            'category_id' => $category->id,
            'department_id' => $category->department_id,
            'city' => 'Karachi',
            'latitude' => 24.87,
            'longitude' => 67.06,
            'title' => 'Large Sinkhole on Sunset Boulevard',
            'description' => 'A very deep sinkhole opened after rain near the intersection.',
            'status' => 'Pending',
            'priority' => 'High',
            'moderation_status' => 'pending_review',
        ]);

        $superAdmin = User::where('role', 'super_admin')->first();
        $superToken = $superAdmin->createToken('test')->plainTextToken;

        app('auth')->forgetGuards();
        $response = $this->withHeader('Authorization', "Bearer {$superToken}")
            ->postJson("/api/super-admin/complaints/{$complaint->id}/approve");

        $response->assertStatus(200);

        // Assert ComplaintLifecycleMail sent to citizen
        Mail::assertSent(ComplaintLifecycleMail::class, function ($mail) use ($citizen) {
            return $mail->hasTo($citizen->email) && $mail->stage === 'approved';
        });

        // Assert citizen received DB notification
        $this->assertTrue(Notification::where('user_id', $citizen->id)->where('complaint_id', $complaint->id)->where('type', 'moderation_approved')->exists());

        // Assert matching Karachi department officer received notification
        $karachiOfficer = User::where('role', 'authority')
            ->where('department_id', $complaint->department_id)
            ->where('city', 'Karachi')
            ->first();

        if ($karachiOfficer) {
            $this->assertTrue(Notification::where('user_id', $karachiOfficer->id)->where('complaint_id', $complaint->id)->where('type', 'complaint_assigned')->exists());
        }

        // Assert officers from other cities (e.g. Lahore) did not receive this notification
        $lahoreOfficers = User::where('role', 'authority')
            ->where('city', 'Lahore')
            ->pluck('id');

        $this->assertFalse(Notification::whereIn('user_id', $lahoreOfficers)->where('complaint_id', $complaint->id)->exists());
    }

    public function test_super_admin_rejection_sends_lifecycle_mail_with_reason_and_db_notification_to_citizen(): void
    {
        $citizen = User::create([
            'name' => 'Rejected Citizen',
            'email' => 'rejected.citizen@fixmycity.org',
            'password' => Hash::make('password123'),
            'role' => 'citizen',
            'status' => 'active',
            'city' => 'Islamabad',
            'email_verified_at' => now(),
        ]);

        $category = Category::first();
        $complaint = Complaint::create([
            'tracking_number' => 'FMC-2026-REJCT',
            'user_id' => $citizen->id,
            'category_id' => $category->id,
            'department_id' => $category->department_id,
            'city' => 'Islamabad',
            'latitude' => 33.72,
            'longitude' => 73.04,
            'title' => 'Unclear Non-Civic Private Dispute',
            'description' => 'Dispute with neighbor regarding property boundary line wall.',
            'status' => 'Pending',
            'priority' => 'Low',
            'moderation_status' => 'pending_review',
        ]);

        $superAdmin = User::where('role', 'super_admin')->first();
        $superToken = $superAdmin->createToken('test')->plainTextToken;

        $rejectionReason = 'FixMyCity only handles public municipal infrastructure issues, not private property disputes.';
        app('auth')->forgetGuards();
        $response = $this->withHeader('Authorization', "Bearer {$superToken}")
            ->postJson("/api/super-admin/complaints/{$complaint->id}/reject", [
                'reason' => $rejectionReason,
            ]);

        $response->assertStatus(200);

        // Assert ComplaintLifecycleMail sent with reason
        Mail::assertSent(ComplaintLifecycleMail::class, function ($mail) use ($citizen, $rejectionReason) {
            return $mail->hasTo($citizen->email) && $mail->stage === 'rejected' && $mail->remarks === $rejectionReason;
        });

        // Assert citizen received DB notification
        $notif = Notification::where('user_id', $citizen->id)->where('complaint_id', $complaint->id)->where('type', 'moderation_rejected')->first();
        $this->assertNotNull($notif);
        $this->assertStringContainsString($rejectionReason, $notif->message);
    }

    public function test_authority_resolving_complaint_sends_lifecycle_mail_and_db_notification_to_citizen(): void
    {
        $citizen = User::create([
            'name' => 'Resolved Citizen',
            'email' => 'resolved.citizen@fixmycity.org',
            'password' => Hash::make('password123'),
            'role' => 'citizen',
            'status' => 'active',
            'city' => 'Karachi',
            'email_verified_at' => now(),
        ]);

        $category = Category::where('category_name', 'Damaged Road / Pothole')->first();
        $complaint = Complaint::create([
            'tracking_number' => 'FMC-2026-RSLVD',
            'user_id' => $citizen->id,
            'category_id' => $category->id,
            'department_id' => $category->department_id,
            'city' => 'Karachi',
            'latitude' => 24.87,
            'longitude' => 67.06,
            'title' => 'Deep Road Crater near Clifton Block 2',
            'description' => 'Pavement collapsed completely creating hazardous pit in traffic lane.',
            'status' => 'In Progress',
            'priority' => 'High',
            'moderation_status' => 'approved',
        ]);

        $authorityUser = User::where('email', 'roads@fixmycity.org')->first();
        $authorityToken = $authorityUser->createToken('test')->plainTextToken;

        $resolutionNotes = 'Asphalt road repair completed and surface smoothed by municipal crew.';
        app('auth')->forgetGuards();
        $response = $this->withHeader('Authorization', "Bearer {$authorityToken}")
            ->patchJson("/api/complaints/{$complaint->id}/status", [
                'status' => 'Resolved',
                'notes' => $resolutionNotes,
            ]);

        $response->assertStatus(200);

        // Assert ComplaintLifecycleMail sent with Resolved stage
        Mail::assertSent(ComplaintLifecycleMail::class, function ($mail) use ($citizen, $resolutionNotes) {
            return $mail->hasTo($citizen->email) && $mail->stage === 'resolved' && $mail->remarks === $resolutionNotes;
        });

        // Assert citizen received DB notification with resolved status
        $notif = Notification::where('user_id', $citizen->id)->where('complaint_id', $complaint->id)->first();
        $this->assertNotNull($notif);
        $this->assertStringContainsString('Resolved', $notif->title);
        $this->assertStringContainsString($resolutionNotes, $notif->message);
    }
}
