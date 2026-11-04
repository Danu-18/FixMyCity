<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Urgent SLA Breach Alert</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fef2f2; color: #1e293b; margin: 0; padding: 24px; }
        .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #fecaca; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; padding: 28px 32px; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
        .header p { margin: 6px 0 0 0; opacity: 0.95; font-size: 14px; }
        .content { padding: 32px; }
        .alert-box { background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px; color: #991b1b; font-size: 14px; }
        .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .details-table td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .details-table td.label { color: #64748b; width: 40%; }
        .details-table td.value { font-weight: 600; color: #0f172a; }
        .btn { display: inline-block; background-color: #dc2626; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 16px; }
        .footer { background-color: #f8fafc; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>FixMyCity SLA Escalation</h1>
            <p>Mandatory Municipal Action Required</p>
        </div>

        <div class="content">
            <div class="alert-box">
                <strong>Attention Municipal Officer:</strong><br>
                Complaint <strong>#{{ $complaint->tracking_number }}</strong> has exceeded its legal Service Level Agreement (SLA) turnaround deadline without being resolved.
            </div>

            <table class="details-table">
                <tr>
                    <td class="label">Complaint Title:</td>
                    <td class="value">{{ $complaint->title }}</td>
                </tr>
                <tr>
                    <td class="label">Assigned Department:</td>
                    <td class="value">{{ $complaint->department->department_name ?? 'N/A' }}</td>
                </tr>
                <tr>
                    <td class="label">Priority:</td>
                    <td class="value" style="color: #dc2626;">{{ $complaint->priority }}</td>
                </tr>
                <tr>
                    <td class="label">SLA Deadline Passed:</td>
                    <td class="value" style="color: #dc2626;">{{ $complaint->sla_deadline ? $complaint->sla_deadline->format('d M Y, h:i A') : 'N/A' }}</td>
                </tr>
                @if($complaint->address)
                <tr>
                    <td class="label">Location:</td>
                    <td class="value">{{ $complaint->address }}</td>
                </tr>
                @endif
            </table>

            <div style="text-align: center; margin-top: 24px;">
                <a href="http://localhost:3000/complaints/{{ $complaint->id }}" class="btn">
                    Inspect Incident & Dispatch Crew
                </a>
            </div>
        </div>

        <div class="footer">
            FixMyCity SLA Compliance Engine &bull; Municipal Oversight System
        </div>
    </div>
</body>
</html>
