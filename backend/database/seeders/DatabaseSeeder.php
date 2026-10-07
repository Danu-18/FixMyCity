<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Complaint;
use App\Models\Department;
use App\Models\Notification;
use App\Models\StatusHistory;
use App\Models\Upvote;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Departments
        $departmentsData = [
            [
                'name' => 'Infrastructure & Road Maintenance',
                'email' => 'roads@fixmycity.org',
                'phone' => '+92-21-99201001',
                'description' => 'Responsible for public roadway repairs, asphalt maintenance, potholes, bridges, and pedestrian walkways.',
                'sla_hours' => 48,
            ],
            [
                'name' => 'Water & Sanitation',
                'email' => 'water@fixmycity.org',
                'phone' => '+92-21-99201002',
                'description' => 'Oversees municipal water supply, pipeline bursts, drinking water quality, and sewage systems.',
                'sla_hours' => 36,
            ],
            [
                'name' => 'Electricity & Power Utilities',
                'email' => 'power@fixmycity.org',
                'phone' => '+92-21-99201003',
                'description' => 'Manages street illumination, electrical grid safety, exposed overhead wiring, and transformers.',
                'sla_hours' => 24,
            ],
            [
                'name' => 'Municipal Waste Management',
                'email' => 'waste@fixmycity.org',
                'phone' => '+92-21-99201004',
                'description' => 'Handles solid waste disposal, overflowing community dumpsters, street sweeping, and storm drains.',
                'sla_hours' => 24,
            ],
            [
                'name' => 'Public Safety & Security',
                'email' => 'safety@fixmycity.org',
                'phone' => '+92-21-99201005',
                'description' => 'Addresses open manholes, hazardous damaged structures, fallen trees, and physical safety hazards.',
                'sla_hours' => 12,
            ],
            [
                'name' => 'Central Administration / IT',
                'email' => 'admin@fixmycity.org',
                'phone' => '+92-21-99201000',
                'description' => 'Central coordination office for inter-departmental escalation and platform management.',
                'sla_hours' => 48,
            ],
        ];

        $deptMap = [];
        foreach ($departmentsData as $data) {
            $dept = Department::create([
                'department_name' => $data['name'],
                'contact_email' => $data['email'],
                'phone' => $data['phone'],
                'description' => $data['description'],
                'sla_hours' => $data['sla_hours'],
            ]);
            $deptMap[$data['name']] = $dept;
        }

        // 2. Categories
        $categoriesData = [
            // Infrastructure & Road Maintenance
            [
                'category_name' => 'Damaged Road / Pothole',
                'department' => 'Infrastructure & Road Maintenance',
                'description' => 'Craters, road cave-ins, and severe asphalt erosion posing vehicular hazard.',
                'default_priority' => 'High',
                'sla_hours' => 48,
                'icon' => 'Car',
            ],
            [
                'category_name' => 'Broken Footpath / Pavement',
                'department' => 'Infrastructure & Road Maintenance',
                'description' => 'Broken curbs and cracked sidewalks hindering pedestrian access.',
                'default_priority' => 'Medium',
                'sla_hours' => 72,
                'icon' => 'Footprints',
            ],
            [
                'category_name' => 'Bridge / Flyover Structural Defect',
                'department' => 'Infrastructure & Road Maintenance',
                'description' => 'Expansion joint cracks, loose guardrails, or structural concrete damage.',
                'default_priority' => 'Urgent',
                'sla_hours' => 24,
                'icon' => 'Landmark',
            ],

            // Water & Sanitation
            [
                'category_name' => 'Water Main Pipe Leakage',
                'department' => 'Water & Sanitation',
                'description' => 'Underground or surface pipe bursting causing water loss and localized flooding.',
                'default_priority' => 'Urgent',
                'sla_hours' => 24,
                'icon' => 'Droplets',
            ],
            [
                'category_name' => 'Contaminated Water Supply',
                'department' => 'Water & Sanitation',
                'description' => 'Discolored, smelly, or unhygienic tap water supplied to residential blocks.',
                'default_priority' => 'Urgent',
                'sla_hours' => 18,
                'icon' => 'AlertTriangle',
            ],
            [
                'category_name' => 'Sewage Overflow / Gutter Blockage',
                'department' => 'Water & Sanitation',
                'description' => 'Sewage water backing up onto streets or into residential frontages.',
                'default_priority' => 'High',
                'sla_hours' => 24,
                'icon' => 'Waves',
            ],

            // Electricity & Power Utilities
            [
                'category_name' => 'Streetlight Outage / Dark Corridor',
                'department' => 'Electricity & Power Utilities',
                'description' => 'Non-functioning street lamps causing dark pedestrian and vehicle zones.',
                'default_priority' => 'Medium',
                'sla_hours' => 36,
                'icon' => 'Lightbulb',
            ],
            [
                'category_name' => 'Exposed Overhead Live Wire',
                'department' => 'Electricity & Power Utilities',
                'description' => 'Loose dangling high-voltage cables posing immediate electrocution hazard.',
                'default_priority' => 'Urgent',
                'sla_hours' => 12,
                'icon' => 'Zap',
            ],
            [
                'category_name' => 'Transformer Sparking / Explosion',
                'department' => 'Electricity & Power Utilities',
                'description' => 'Pole-mounted electrical transformer sparking, smoking, or sparking fires.',
                'default_priority' => 'Urgent',
                'sla_hours' => 12,
                'icon' => 'Flame',
            ],

            // Municipal Waste Management
            [
                'category_name' => 'Overflowing Garbage Container',
                'department' => 'Municipal Waste Management',
                'description' => 'Community garbage bins overflowing with waste spilling onto roads.',
                'default_priority' => 'High',
                'sla_hours' => 24,
                'icon' => 'Trash2',
            ],
            [
                'category_name' => 'Illegal Trash Dumping',
                'department' => 'Municipal Waste Management',
                'description' => 'Unauthorized dumping of commercial or domestic debris in open plots.',
                'default_priority' => 'Medium',
                'sla_hours' => 48,
                'icon' => 'Ban',
            ],
            [
                'category_name' => 'Blocked Storm Water Drain',
                'department' => 'Municipal Waste Management',
                'description' => 'Drains choked with plastic bags and silt preventing rainwater drainage.',
                'default_priority' => 'High',
                'sla_hours' => 36,
                'icon' => 'Filter',
            ],

            // Public Safety & Security
            [
                'category_name' => 'Missing Manhole Cover',
                'department' => 'Public Safety & Security',
                'description' => 'Open deep manholes left uncovered on streets, creating fatal risk.',
                'default_priority' => 'Urgent',
                'sla_hours' => 12,
                'icon' => 'ShieldAlert',
            ],
            [
                'category_name' => 'Fallen / Hazardous Tree',
                'department' => 'Public Safety & Security',
                'description' => 'Large branches or uprooted trees blocking thoroughfares or touching wires.',
                'default_priority' => 'High',
                'sla_hours' => 24,
                'icon' => 'Trees',
            ],

            // Central Administration / IT
            [
                'category_name' => 'Public Pathway Encroachment',
                'department' => 'Central Administration / IT',
                'description' => 'Unauthorized kiosks, stalls, or constructions blocking public rights of way.',
                'default_priority' => 'Low',
                'sla_hours' => 72,
                'icon' => 'Building',
            ],
        ];

        $catMap = [];
        foreach ($categoriesData as $c) {
            $category = Category::create([
                'category_name' => $c['category_name'],
                'department_id' => $deptMap[$c['department']]->id,
                'description' => $c['description'],
                'default_priority' => $c['default_priority'],
                'sla_hours' => $c['sla_hours'],
                'icon' => $c['icon'],
            ]);
            $catMap[$c['category_name']] = $category;
        }

        // 3. Seed Users (RBAC)
        $hashedPassword = Hash::make('password123');

        // Citizens
        $citizenDanial = User::create([
            'name' => 'Danial Arif',
            'email' => 'citizen@fixmycity.org',
            'password' => $hashedPassword,
            'role' => 'citizen',
            'phone' => '+92 370 3130213',
        ]);

        $citizenAyesha = User::create([
            'name' => 'Ayesha Khan',
            'email' => 'citizen2@fixmycity.org',
            'password' => $hashedPassword,
            'role' => 'citizen',
            'phone' => '+92 300 1234567',
        ]);

        // Authority Staff
        $staffRoads = User::create([
            'name' => 'Engr. Tariq Mehmood',
            'email' => 'roads@fixmycity.org',
            'password' => $hashedPassword,
            'role' => 'authority',
            'department_id' => $deptMap['Infrastructure & Road Maintenance']->id,
            'phone' => '+92 321 9876543',
        ]);

        $staffWater = User::create([
            'name' => 'Zubair Ahmed',
            'email' => 'water@fixmycity.org',
            'password' => $hashedPassword,
            'role' => 'authority',
            'department_id' => $deptMap['Water & Sanitation']->id,
            'phone' => '+92 333 4567890',
        ]);

        $staffPower = User::create([
            'name' => 'Farhan Ali',
            'email' => 'power@fixmycity.org',
            'password' => $hashedPassword,
            'role' => 'authority',
            'department_id' => $deptMap['Electricity & Power Utilities']->id,
            'phone' => '+92 312 3456789',
        ]);

        $staffWaste = User::create([
            'name' => 'Sadia Qureshi',
            'email' => 'waste@fixmycity.org',
            'password' => $hashedPassword,
            'role' => 'authority',
            'department_id' => $deptMap['Municipal Waste Management']->id,
            'phone' => '+92 345 6789012',
        ]);

        $staffSafety = User::create([
            'name' => 'Inspector Majid Raza',
            'email' => 'safety@fixmycity.org',
            'password' => $hashedPassword,
            'role' => 'authority',
            'department_id' => $deptMap['Public Safety & Security']->id,
            'phone' => '+92 301 2345678',
        ]);

        // Admin
        $adminUser = User::create([
            'name' => 'Director General Civic Affairs',
            'email' => 'admin@fixmycity.org',
            'password' => $hashedPassword,
            'role' => 'admin',
            'department_id' => $deptMap['Central Administration / IT']->id,
            'phone' => '+92 300 0000000',
        ]);

        // 4. Seed Complaints with Realistic Pakistani Geospatial Coordinates & Details
        $seedComplaints = [
            [
                'tracking' => 'FMC-2026-1001',
                'user' => $citizenDanial,
                'category' => $catMap['Damaged Road / Pothole'],
                'title' => 'Severe Pothole Cluster near Gulshan Chowrangi',
                'description' => 'Multiple deep potholes spanning 4 meters on the main carriageway causing heavy tire damage and severe traffic congestion during peak hours.',
                'lat' => 24.9288,
                'lng' => 67.0982,
                'address' => 'Main University Road, Near Gulshan Chowrangi, Karachi',
                'status' => 'Pending',
                'priority' => 'High',
                'created_at' => Carbon::now()->subHours(10),
                'sla_deadline' => Carbon::now()->addHours(38),
                'upvotes' => 14,
            ],
            [
                'tracking' => 'FMC-2026-1002',
                'user' => $citizenAyesha,
                'category' => $catMap['Water Main Pipe Leakage'],
                'title' => 'Burst 12-inch Water Main Flooding Street',
                'description' => 'High pressure clean water gushing from broken distribution line since early morning. Flooding 200 meters of residential lane and depriving 40+ households of drinking water.',
                'lat' => 24.8615,
                'lng' => 67.0099,
                'address' => 'Lane 4, Saddar Commercial Area, Karachi',
                'status' => 'In Progress',
                'priority' => 'Urgent',
                'created_at' => Carbon::now()->subHours(18),
                'sla_deadline' => Carbon::now()->addHours(6),
                'upvotes' => 28,
            ],
            [
                'tracking' => 'FMC-2026-1003',
                'user' => $citizenDanial,
                'category' => $catMap['Missing Manhole Cover'],
                'title' => 'Lethal Open Manhole on School Transit Route',
                'description' => 'Circular sewer manhole cover missing for 3 days directly in front of the primary school gate. Extremely dangerous for children and motorcyclists at night.',
                'lat' => 24.8934,
                'lng' => 67.0872,
                'address' => 'Block 7, Gulshan-e-Iqbal, Karachi',
                'status' => 'Resolved',
                'priority' => 'Urgent',
                'created_at' => Carbon::now()->subDays(2),
                'sla_deadline' => Carbon::now()->subDays(1)->subHours(12),
                'resolved_at' => Carbon::now()->subHours(6),
                'resolution_notes' => 'Emergency rapid response unit deployed heavy reinforced concrete slab cover and sealed surrounding curb.',
                'upvotes' => 45,
            ],
            [
                'tracking' => 'FMC-2026-1004',
                'user' => $citizenAyesha,
                'category' => $catMap['Overflowing Garbage Container'],
                'title' => 'Massive Waste Dump Spilling into Market',
                'description' => 'Solid waste compactor hasn’t visited for 5 days. Flies and foul stench spreading across local bazaar fruit stalls.',
                'lat' => 24.8732,
                'lng' => 67.0543,
                'address' => 'Tariq Road Market Corner, PECHS, Karachi',
                'status' => 'In Progress',
                'priority' => 'High',
                'created_at' => Carbon::now()->subHours(20),
                'sla_deadline' => Carbon::now()->addHours(4),
                'upvotes' => 19,
            ],
            [
                'tracking' => 'FMC-2026-1005',
                'user' => $citizenDanial,
                'category' => $catMap['Exposed Overhead Live Wire'],
                'title' => 'Dangling 440V Cable Touching Metal Gate',
                'description' => 'Overhead utility cable broke during night windstorm and is dangling approximately 5 feet above the pavement, sparking when touching adjacent metal shop railing.',
                'lat' => 24.9452,
                'lng' => 67.0628,
                'address' => 'North Nazimabad Block H, Karachi',
                'status' => 'Pending',
                'priority' => 'Urgent',
                'created_at' => Carbon::now()->subHours(2),
                'sla_deadline' => Carbon::now()->addHours(10),
                'upvotes' => 31,
            ],
            [
                'tracking' => 'FMC-2026-1006',
                'user' => $citizenAyesha,
                'category' => $catMap['Streetlight Outage / Dark Corridor'],
                'title' => 'Total Blackout of 8 Consecutive Streetlights',
                'description' => 'Entire 400m stretch of residential road is plunged in pitch dark after sunset. High frequency of snatching attempts reported this week.',
                'lat' => 24.8138,
                'lng' => 67.0490,
                'address' => 'Khayaban-e-Shamsheer, Phase 5, DHA, Karachi',
                'status' => 'Pending',
                'priority' => 'Medium',
                'created_at' => Carbon::now()->subHours(15),
                'sla_deadline' => Carbon::now()->addHours(21),
                'upvotes' => 9,
            ],
            [
                'tracking' => 'FMC-2026-1007',
                'user' => $citizenDanial,
                'category' => $catMap['Sewage Overflow / Gutter Blockage'],
                'title' => 'Foul Sewage Backflow on Main Commercial Strip',
                'description' => 'Drain line clogged with plastic construction debris causing untreated sewage to pool across pedestrian crossing.',
                'lat' => 24.8302,
                'lng' => 67.0345,
                'address' => 'Near Zamzama Boulevard, Clifton, Karachi',
                'status' => 'Resolved',
                'priority' => 'High',
                'created_at' => Carbon::now()->subDays(3),
                'sla_deadline' => Carbon::now()->subDays(2),
                'resolved_at' => Carbon::now()->subDay(),
                'resolution_notes' => 'Suction truck cleared obstruction from mainline sewer and flushed pipes.',
                'upvotes' => 22,
            ],
            [
                'tracking' => 'FMC-2026-1008',
                'user' => $citizenAyesha,
                'category' => $catMap['Public Pathway Encroachment'],
                'title' => 'Steel Shed Erected Over Entire Pedestrian Walkway',
                'description' => 'Commercial workshop extended iron welding shed right over the public sidewalk, forcing all foot traffic into ongoing 60km/h traffic.',
                'lat' => 24.9123,
                'lng' => 67.1145,
                'address' => 'Rashid Minhas Road, Near Millennium Mall, Karachi',
                'status' => 'Pending',
                'priority' => 'Low',
                'created_at' => Carbon::now()->subHours(30),
                'sla_deadline' => Carbon::now()->addHours(42),
                'upvotes' => 8,
            ],
        ];

        foreach ($seedComplaints as $sc) {
            $cat = $sc['category'];
            $complaint = Complaint::create([
                'tracking_number' => $sc['tracking'],
                'user_id' => $sc['user']->id,
                'category_id' => $cat->id,
                'department_id' => $cat->department_id,
                'title' => $sc['title'],
                'description' => $sc['description'],
                'latitude' => $sc['lat'],
                'longitude' => $sc['lng'],
                'address' => $sc['address'],
                'status' => $sc['status'],
                'priority' => $sc['priority'],
                'sla_deadline' => $sc['sla_deadline'],
                'resolved_at' => $sc['resolved_at'] ?? null,
                'resolution_notes' => $sc['resolution_notes'] ?? null,
                'created_at' => $sc['created_at'],
                'updated_at' => $sc['created_at'],
            ]);

            // Status history
            StatusHistory::create([
                'complaint_id' => $complaint->id,
                'old_status' => null,
                'new_status' => 'Pending',
                'changed_by' => $sc['user']->id,
                'notes' => 'Complaint logged and mapped to ' . $cat->department->department_name . ' via state-machine engine.',
                'changed_at' => $sc['created_at'],
                'created_at' => $sc['created_at'],
            ]);

            if ($sc['status'] === 'In Progress' || $sc['status'] === 'Resolved') {
                StatusHistory::create([
                    'complaint_id' => $complaint->id,
                    'old_status' => 'Pending',
                    'new_status' => 'In Progress',
                    'changed_by' => $staffRoads->id,
                    'notes' => 'Work order generated and field inspection crew dispatched.',
                    'changed_at' => Carbon::parse($sc['created_at'])->addHours(4),
                    'created_at' => Carbon::parse($sc['created_at'])->addHours(4),
                ]);
            }

            if ($sc['status'] === 'Resolved') {
                StatusHistory::create([
                    'complaint_id' => $complaint->id,
                    'old_status' => 'In Progress',
                    'new_status' => 'Resolved',
                    'changed_by' => $staffSafety->id,
                    'notes' => $sc['resolution_notes'] ?? 'Issue verified and repaired on site.',
                    'changed_at' => $sc['resolved_at'],
                    'created_at' => $sc['resolved_at'],
                ]);
            }

            // Upvotes
            Upvote::create([
                'complaint_id' => $complaint->id,
                'user_id' => $sc['user']->id,
            ]);

            if ($sc['upvotes'] > 1) {
                // Add upvote by the other citizen
                $otherUser = ($sc['user']->id === $citizenDanial->id) ? $citizenAyesha : $citizenDanial;
                Upvote::firstOrCreate([
                    'complaint_id' => $complaint->id,
                    'user_id' => $otherUser->id,
                ]);
            }

            // Add notification
            Notification::create([
                'user_id' => $sc['user']->id,
                'complaint_id' => $complaint->id,
                'title' => "Complaint #{$sc['tracking']} Created",
                'message' => "Your complaint has been automatically routed to {$cat->department->department_name}.",
                'type' => 'status_change',
                'created_at' => $sc['created_at'],
            ]);
        }
    }
}
