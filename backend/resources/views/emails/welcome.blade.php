<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome</title>
</head>
<body style="margin:0; padding:0; background-color:#FFFAF8; font-family: -apple-system, Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFAF8; padding: 32px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF; border-radius:20px; overflow:hidden; border:1px solid #F0E4E8;">
                    <tr>
                        <td style="background-color:#6BAE8A; padding: 28px; text-align:center;">
                            <span style="font-size:32px;">🌸</span>
                            <h1 style="color:#FFFFFF; font-size:22px; margin:8px 0 0;">Welcome to {{ config('app.name') }}</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 32px;">
                            <p style="font-size:16px; color:#2D2020; margin:0 0 16px;">Hi {{ $name }},</p>
                            <p style="font-size:15px; color:#4A3A3A; line-height:1.6; margin:0 0 16px;">
                                Thanks for creating an account! We're excited to help you track every precious
                                moment of your baby's journey &mdash; feeds, sleep, diapers, growth, and more,
                                all in one place.
                            </p>
                            <p style="font-size:15px; color:#4A3A3A; line-height:1.6; margin:0 0 24px;">
                                You're all set to get started. Open the app and log your first entry whenever you're ready.
                            </p>
                            <p style="font-size:14px; color:#8A7070; margin:0;">
                                With love,<br>
                                The {{ config('app.name') }} Team
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
