<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Complaint Registered - FixMyCity</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b; margin: 0; padding: 24px; }
        .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; padding: 28px 32px; text-align: left; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
        .header p { margin: 6px 0 0 0; opacity: 0.9; font-size: 14px; }
        .content { padding: 32px; }
        .tracking-box { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px 20px; margin: 20px 0; text-align: center; }
        .tracking-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #15803d; font-weight: 600; }
        .tracking-code { font-size: 26px; font-weight: 800; color: #166534; font-family: monospace; margin-top: 4px; }
        .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .details-table td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .details-table td.label { color: #64748b; width: 40%; }
        .details-table td.value { font-weight: 600; color: #0f172a; }
        .btn { display: inline-block; background-color: #0284c7; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 16px; }
        .footer { background-color: #f8fafc; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>FixMyCity Platform</h1>
            <p>Civic Issue Complaint Confirmation</p>
        </div>

        <div class="content">
            <p>Hello,</p>
            <p>Thank you for reporting a civic issue to municipal authorities. Your complaint has been automatically categorized and routed through the FixMyCity state machine.</p>

            <div class="tracking-box">
                <div class="tracking-label">Your Tracking ID</div>
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
                    <td class="label">Assigned Department:</td>
                    <td class="value">{{ $complaint->department->department_name ?? 'N/A' }}</td>
                </tr>
                <tr>
                    <td class="label">Priority Level:</td>
                    <td class="value">{{ $complaint->priority }}</td>
                </tr>
                @if($complaint->address)
                <tr>
                    <td class="label">Location Address:</td>
                    <td class="value">{{ $complaint->address }}</td>
                </tr>
                @endif
                @if($complaint->sla_deadline)
                <tr>
                    <td class="label">Target SLA Resolution:</td>
                    <td class="value">{{ $complaint->sla_deadline->format('d M Y, h:i A') }}</td>
                </tr>
                @endif
            </table>

            <p style="font-size: 14px; color: #475569;">
                You can use your tracking ID anytime to monitor progress, review staff inspection notes, and view repair completion photos.
            </p>

            <div style="text-align: center; margin-top: 24px;">
                <a href="http://localhost:3000/track?tracking={{ $complaint->tracking_number }}" class="btn">
                    Track Complaint Status
                </a>
            </div>
        </div>

        <div class="footer">
            FixMyCity Civic Operations &bull; Automated Municipal Resolution System
        </div>
    </div>
</body>
</html>
