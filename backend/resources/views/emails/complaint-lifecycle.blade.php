<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FixMyCity Complaint Lifecycle Update</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b; margin: 0; padding: 24px; }
        .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; padding: 28px 32px; text-align: left; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
        .header p { margin: 6px 0 0 0; opacity: 0.9; font-size: 14px; }
        .content { padding: 32px; }
        .status-badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
        .tracking-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin: 20px 0; text-align: center; }
        .tracking-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600; }
        .tracking-code { font-size: 24px; font-weight: 800; color: #0284c7; font-family: monospace; margin-top: 4px; }
        .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .details-table td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .details-table td.label { color: #64748b; width: 40%; }
        .details-table td.value { font-weight: 600; color: #0f172a; }
        .remarks-box { background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 14px 18px; margin: 18px 0; font-size: 13px; color: #92400e; }
        .rejection-box { background-color: #fef2f2; border: 1px solid #fee2e2; border-left: 4px solid #ef4444; border-radius: 6px; padding: 14px 18px; margin: 18px 0; font-size: 13px; color: #991b1b; }
        .next-step-box { background-color: #f0fdf4; border: 1px solid #dcfce7; border-radius: 8px; padding: 14px 18px; margin: 20px 0; font-size: 13px; color: #166534; }
        .next-step-title { font-weight: 700; margin-bottom: 4px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em; }
        .footer { background-color: #f8fafc; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>FixMyCity Platform</h1>
            <p>Civic Incident Lifecycle Notification</p>
        </div>

        <div class="content">
            <p style="margin-top: 0; font-size: 15px;">Hello <strong>{{ $complaint->user->name ?? 'Citizen' }}</strong>,</p>

            <p style="font-size: 14px; line-height: 1.6; color: #334155;">
                {{ $messageBody }}
            </p>

            <div class="tracking-box">
                <div class="tracking-label">Tracking Number</div>
                <div class="tracking-code">{{ $complaint->tracking_number }}</div>
            </div>

            <table class="details-table">
                <tr>
                    <td class="label">Issue Title:</td>
                    <td class="value">{{ $complaint->title }}</td>
                </tr>
                <tr>
                    <td class="label">Category:</td>
                    <td class="value">{{ $complaint->category->category_name ?? 'N/A' }}</td>
                </tr>
                <tr>
                    <td class="label">Department:</td>
                    <td class="value">{{ $complaint->department->department_name ?? 'N/A' }}</td>
                </tr>
                <tr>
                    <td class="label">City Jurisdiction:</td>
                    <td class="value">{{ $complaint->city }}</td>
                </tr>
                <tr>
                    <td class="label">Moderation Status:</td>
                    <td class="value">
                        @if($complaint->moderation_status === 'approved')
                            <span style="color: #16a34a; font-weight: 700;">Approved & Public</span>
                        @elseif($complaint->moderation_status === 'rejected')
                            <span style="color: #dc2626; font-weight: 700;">Rejected in Moderation</span>
                        @else
                            <span style="color: #d97706; font-weight: 700;">Pending Review</span>
                        @endif
                    </td>
                </tr>
                <tr>
                    <td class="label">Operational Status:</td>
                    <td class="value" style="font-weight: 700; color: #0284c7;">
                        {{ $complaint->status }}
                    </td>
                </tr>
            </table>

            @if($stage === 'rejected' && $remarks)
                <div class="rejection-box">
                    <strong>Moderation Rejection Reason:</strong><br>
                    {{ $remarks }}
                </div>
            @elseif($remarks)
                <div class="remarks-box">
                    <strong>Official Authority Remarks:</strong><br>
                    {{ $remarks }}
                </div>
            @endif

            @if($nextStep)
                <div class="next-step-box">
                    <div class="next-step-title">What Happens Next?</div>
                    {{ $nextStep }}
                </div>
            @endif
        </div>

        <div class="footer">
            &copy; {{ date('Y') }} FixMyCity Civic Resolution Platform. All rights reserved.
            <br>
            You received this automated notification because your email is registered as the reporting citizen on this issue.
        </div>
    </div>
</body>
</html>
