<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BCMP API | kapitan.ph</title>
    <link rel="icon" href="/favicon.ico" type="image/x-icon">
    <meta name="robots" content="noindex, nofollow">
    <style>
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0e1a;
            color: #e2e8f0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
        }

        /* Animated gradient background */
        body::before {
            content: '';
            position: fixed;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(ellipse at 20% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 20%, rgba(139, 92, 246, 0.06) 0%, transparent 50%),
                        radial-gradient(ellipse at 50% 80%, rgba(16, 185, 129, 0.04) 0%, transparent 50%);
            animation: bgShift 20s ease-in-out infinite;
            z-index: 0;
        }

        @keyframes bgShift {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(-2%, 1%) rotate(1deg); }
            66% { transform: translate(1%, -2%) rotate(-1deg); }
        }

        /* Grid pattern overlay */
        body::after {
            content: '';
            position: fixed;
            inset: 0;
            background-image:
                linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
            background-size: 60px 60px;
            z-index: 0;
        }

        .container {
            position: relative;
            z-index: 1;
            text-align: center;
            max-width: 580px;
            padding: 0 24px;
        }

        /* Animated logo mark */
        .logo-mark {
            width: 72px;
            height: 72px;
            margin: 0 auto 32px;
            position: relative;
        }

        .logo-ring {
            position: absolute;
            inset: 0;
            border: 2px solid rgba(59, 130, 246, 0.3);
            border-radius: 50%;
            animation: ringPulse 3s ease-in-out infinite;
        }

        .logo-ring:nth-child(2) {
            inset: -8px;
            border-color: rgba(139, 92, 246, 0.15);
            animation-delay: 0.5s;
        }

        .logo-ring:nth-child(3) {
            inset: -16px;
            border-color: rgba(59, 130, 246, 0.08);
            animation-delay: 1s;
        }

        @keyframes ringPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.6; }
        }

        .logo-inner {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15));
            border-radius: 50%;
            backdrop-filter: blur(8px);
            border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .logo-inner svg {
            width: 32px;
            height: 32px;
            color: #3b82f6;
        }

        /* Badge */
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 16px;
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.2);
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: #60a5fa;
            margin-bottom: 24px;
        }

        .badge-dot {
            width: 6px;
            height: 6px;
            background: #3b82f6;
            border-radius: 50%;
            animation: dotPulse 2s ease-in-out infinite;
        }

        @keyframes dotPulse {
            0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
            50% { opacity: 0.8; box-shadow: 0 0 0 6px rgba(59, 130, 246, 0); }
        }

        h1 {
            font-size: 36px;
            font-weight: 700;
            letter-spacing: -0.5px;
            margin-bottom: 8px;
            background: linear-gradient(135deg, #f8fafc, #94a3b8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .subtitle {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 40px;
            line-height: 1.6;
        }

        .subtitle strong {
            color: #94a3b8;
        }

        /* Status card */
        .status-card {
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid rgba(51, 65, 85, 0.4);
            border-radius: 16px;
            padding: 24px;
            backdrop-filter: blur(16px);
            margin-bottom: 24px;
        }

        .status-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 0;
        }

        .status-row + .status-row {
            border-top: 1px solid rgba(51, 65, 85, 0.3);
        }

        .status-label {
            font-size: 13px;
            color: #64748b;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .status-label svg {
            width: 16px;
            height: 16px;
            opacity: 0.6;
        }

        .status-value {
            font-size: 13px;
            font-weight: 500;
            color: #cbd5e1;
            font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
        }

        .status-online {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: #34d399;
            font-weight: 600;
        }

        .status-online::before {
            content: '';
            width: 8px;
            height: 8px;
            background: #10b981;
            border-radius: 50%;
            box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
            animation: statusPulse 2s ease-in-out infinite;
        }

        @keyframes statusPulse {
            0%, 100% { box-shadow: 0 0 8px rgba(16, 185, 129, 0.5); }
            50% { box-shadow: 0 0 16px rgba(16, 185, 129, 0.3); }
        }

        /* Endpoint pills */
        .endpoints {
            display: flex;
            gap: 8px;
            justify-content: center;
            flex-wrap: wrap;
            margin-bottom: 40px;
        }

        .endpoint {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 6px 12px;
            background: rgba(30, 41, 59, 0.5);
            border: 1px solid rgba(51, 65, 85, 0.3);
            border-radius: 8px;
            font-size: 12px;
            font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
            color: #64748b;
            transition: all 0.2s;
        }

        .endpoint:hover {
            border-color: rgba(59, 130, 246, 0.3);
            color: #94a3b8;
        }

        .endpoint-method {
            font-weight: 700;
            font-size: 10px;
            padding: 1px 4px;
            border-radius: 3px;
        }

        .method-get { color: #34d399; }
        .method-post { color: #60a5fa; }

        /* Footer */
        .footer {
            color: #334155;
            font-size: 12px;
            line-height: 1.8;
        }

        .footer a {
            color: #475569;
            text-decoration: none;
            border-bottom: 1px solid rgba(71, 85, 105, 0.3);
            transition: color 0.2s;
        }

        .footer a:hover {
            color: #64748b;
        }

        /* Floating particles */
        .particle {
            position: fixed;
            width: 2px;
            height: 2px;
            background: rgba(59, 130, 246, 0.3);
            border-radius: 50%;
            z-index: 0;
            animation: float linear infinite;
        }

        @keyframes float {
            0% { transform: translateY(100vh) scale(0); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(-10vh) scale(1); opacity: 0; }
        }
    </style>
</head>
<body>
    <!-- Floating particles -->
    <div class="particle" style="left:10%;animation-duration:18s;animation-delay:0s;width:2px;height:2px;"></div>
    <div class="particle" style="left:25%;animation-duration:22s;animation-delay:3s;width:3px;height:3px;background:rgba(139,92,246,0.2);"></div>
    <div class="particle" style="left:40%;animation-duration:16s;animation-delay:6s;width:2px;height:2px;"></div>
    <div class="particle" style="left:55%;animation-duration:24s;animation-delay:2s;width:1px;height:1px;background:rgba(16,185,129,0.3);"></div>
    <div class="particle" style="left:70%;animation-duration:20s;animation-delay:5s;width:2px;height:2px;"></div>
    <div class="particle" style="left:85%;animation-duration:19s;animation-delay:8s;width:3px;height:3px;background:rgba(139,92,246,0.15);"></div>
    <div class="particle" style="left:15%;animation-duration:25s;animation-delay:10s;width:2px;height:2px;background:rgba(16,185,129,0.2);"></div>
    <div class="particle" style="left:60%;animation-duration:17s;animation-delay:4s;width:2px;height:2px;"></div>

    <div class="container">
        <!-- Animated logo -->
        <div class="logo-mark">
            <div class="logo-ring"></div>
            <div class="logo-ring"></div>
            <div class="logo-ring"></div>
            <div class="logo-inner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                </svg>
            </div>
        </div>

        <!-- Badge -->
        <div class="badge">
            <span class="badge-dot"></span>
            API Service
        </div>

        <!-- Title -->
        <h1>BCMP API</h1>
        <p class="subtitle">
            Barangay Comprehensive Management Platform<br>
            Backend service powering <strong>kapitan.ph</strong>
        </p>

        <!-- Status card -->
        <div class="status-card">
            <div class="status-row">
                <span class="status-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Status
                </span>
                <span class="status-value status-online">Operational</span>
            </div>
            <div class="status-row">
                <span class="status-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                    Environment
                </span>
                <span class="status-value">{{ app()->environment() }}</span>
            </div>
            <div class="status-row">
                <span class="status-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                    Runtime
                </span>
                <span class="status-value">PHP {{ PHP_VERSION }} / Laravel {{ app()->version() }}</span>
            </div>
            <div class="status-row">
                <span class="status-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Auth
                </span>
                <span class="status-value">Sanctum (Token-based)</span>
            </div>
            <div class="status-row">
                <span class="status-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
                    Database
                </span>
                <span class="status-value">PostgreSQL 17</span>
            </div>
        </div>

        <!-- API endpoints preview -->
        <div class="endpoints">
            <span class="endpoint"><span class="endpoint-method method-post">POST</span> /auth/login</span>
            <span class="endpoint"><span class="endpoint-method method-get">GET</span> /auth/me</span>
            <span class="endpoint"><span class="endpoint-method method-get">GET</span> /residents</span>
            <span class="endpoint"><span class="endpoint-method method-get">GET</span> /dashboard/stats</span>
        </div>

        <!-- Footer -->
        <div class="footer">
            <a href="https://kapitan.ph">kapitan.ph</a> &middot; <a href="https://primex.ventures">PrimeX Ventures Inc.</a><br>
            &copy; 2015&ndash;{{ date('Y') }} All Rights Reserved
        </div>
    </div>
</body>
</html>
