<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Complaint Status Updated - FixMyCity</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b; margin: 0; padding: 24px; }
        .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; padding: 28px 32px; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
        .header p { margin: 6px 0 0 0; opacity: 0.9; font-size: 14px; }
        .content { padding: 32px; }
        .status-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 24px; margin: 20px 0; display: flex; align-items: center; justify-content: space-between; }
        .status-badge { display: inline-block; padding: 6px 14px; border-radius: 9999px; font-weight: 700; font-size: 14px; text-transform: uppercase; }
        .status-Pending { background-color: #fef3c7; color: #92400e; }
        .status-In-Progress { background-color: #e0f2fe; color: #0369a1; }
        .status-Resolved { background-color: #dcfce7; color: #166534; }
        .status-Rejected { background-color: #fee2e2; color: #991b1b; }
        .notes-box { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 18px; margin: 18px 0; border-radius: 0 8px 8px 0; font-size: 14px; color: #1e40af; }
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
            <h1>FixMyCity Status Update</h1>
            <p>Real-Time Resolution Progress</p>
        </div>

        <div class="content">
            <p>Hello,</p>
            <p>Your reported civic issue <strong>#{{ $complaint->tracking_number }}</strong> has changed status in the municipal resolution workflow.</p>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
                <table style="width: 100%;">
                    <tr>
                        <td style="color: #64748b; font-size: 13px;">Previous Status:</td>
                        <td style="text-align: right; font-weight: 600; color: #475569;">{{ $oldStatus }}</td>
                    </tr>
                    <tr>
                        <td style="color: #0f172a; font-size: 15px; font-weight: 700; padding-top: 8px;">New Status:</td>
                        <td style="text-align: right; padding-top: 8px;">
                            <span class="status-badge status-{{ str_replace(' ', '-', $newStatus) }}">{{ $newStatus }}</span>
                        </td>
                    </tr>
                </table>
            </div>

            @if($notes)
            <div class="notes-box">
                <strong>Officer Remarks / Work Log:</strong><br>
                {{ $notes }}
            </div>
            @endif

            <table class="details-table">
                <tr>
                    <td class="label">Issue Title:</td>
                    <td class="value">{{ $complaint->title }}</td>
                </tr>
                <tr>
                    <td class="label">Department:</td>
                    <td class="value">{{ $complaint->department->department_name ?? 'N/A' }}</td>
                </tr>
                @if($newStatus === 'Resolved' && $complaint->resolved_at)
                <tr>
                    <td class="label">Resolved Timestamp:</td>
                    <td class="value" style="color: #166534;">{{ $complaint->resolved_at->format('d M Y, h:i A') }}</td>
                </tr>
                @endif
            </table>

            <div style="text-align: center; margin-top: 24px;">
                <a href="http://localhost:3000/track?tracking={{ $complaint->tracking_number }}" class="btn">
                    View Complete Audit Trail
                </a>
            </div>
        </div>

        <div class="footer">
            FixMyCity Civic Operations &bull; Automated Municipal Resolution System
        </div>
    </div>
</body>
</html>
