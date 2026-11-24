<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - FixMyCity</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b; margin: 0; padding: 24px; }
        .wrapper { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; padding: 28px 32px; text-align: left; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
        .header p { margin: 6px 0 0 0; opacity: 0.9; font-size: 14px; }
        .content { padding: 32px; }
        .code-box { background-color: #f0fdf4; border: 2px dashed #86efac; border-radius: 10px; padding: 20px; margin: 24px 0; text-align: center; }
        .code-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #15803d; font-weight: 700; margin-bottom: 6px; }
        .otp-code { font-size: 34px; font-weight: 800; color: #166534; font-family: 'Courier New', Courier, monospace; letter-spacing: 8px; margin: 8px 0; }
        .expiry-text { font-size: 13px; color: #64748b; margin-top: 6px; }
        .notice { font-size: 14px; line-height: 1.6; color: #334155; }
        .security-tip { font-size: 13px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
        .footer { background-color: #f8fafc; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>FixMyCity</h1>
            <p>Citizen Portal Email Verification</p>
        </div>

        <div class="content">
            <p class="notice">Hello,</p>
            <p class="notice">Welcome to FixMyCity! To complete your citizen account setup and verify your email address, please enter the following 6-digit verification code:</p>

            <div class="code-box">
                <div class="code-label">Verification Code (OTP)</div>
                <div class="otp-code">{{ $code }}</div>
                <div class="expiry-text">Valid for <strong>{{ $expiresInMinutes }} minutes</strong></div>
            </div>

            <p class="notice">Enter this code on the verification screen to activate your account and start reporting and tracking civic issues in your city.</p>

            <div class="security-tip">
                <strong>Security Notice:</strong> If you did not create an account on FixMyCity, please disregard this email. Do not share this code with anyone.
            </div>
        </div>

        <div class="footer">
            &copy; {{ date('Y') }} FixMyCity Civic Resolution Platform. All rights reserved.
        </div>
    </div>
</body>
</html>
