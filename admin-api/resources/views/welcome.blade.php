<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PrimeX Ventures | primex.ventures</title>
    <link rel="icon" href="https://primex.ventures/favicon.ico" type="image/x-icon">
    <meta name="robots" content="noindex, nofollow">
    <style>
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0a0e1a; color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; }
        body::before { content: ""; position: fixed; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(ellipse at 20% 50%, rgba(234,88,12,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(251,146,60,0.06) 0%, transparent 50%); animation: bgShift 20s ease-in-out infinite; z-index: 0; }
        @keyframes bgShift { 0%, 100% { transform: translate(0,0); } 33% { transform: translate(-2%,1%); } 66% { transform: translate(1%,-2%); } }
        body::after { content: ""; position: fixed; inset: 0; background-image: linear-gradient(rgba(234,88,12,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(234,88,12,0.03) 1px, transparent 1px); background-size: 60px 60px; z-index: 0; }
        .container { position: relative; z-index: 1; text-align: center; max-width: 480px; padding: 0 24px; }
        .logo-mark { width: 72px; height: 72px; margin: 0 auto 32px; position: relative; }
        .logo-ring { position: absolute; inset: 0; border: 2px solid rgba(234,88,12,0.3); border-radius: 50%; animation: ringPulse 3s ease-in-out infinite; }
        .logo-ring:nth-child(2) { inset: -8px; border-color: rgba(251,146,60,0.15); animation-delay: 0.5s; }
        .logo-ring:nth-child(3) { inset: -16px; border-color: rgba(234,88,12,0.08); animation-delay: 1s; }
        @keyframes ringPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.6; } }
        .logo-inner { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, rgba(234,88,12,0.15), rgba(251,146,60,0.15)); border-radius: 50%; backdrop-filter: blur(8px); border: 1px solid rgba(234,88,12,0.2); }
        .logo-inner svg { width: 32px; height: 32px; color: #ea580c; }
        .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 16px; background: rgba(234,88,12,0.1); border: 1px solid rgba(234,88,12,0.2); border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #fb923c; margin-bottom: 24px; }
        .badge-dot { width: 6px; height: 6px; background: #ea580c; border-radius: 50%; animation: dotPulse 2s ease-in-out infinite; }
        @keyframes dotPulse { 0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(234,88,12,0.4); } 50% { opacity: 0.8; box-shadow: 0 0 0 6px rgba(234,88,12,0); } }
        h1 { font-size: 32px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 8px; background: linear-gradient(135deg, #f8fafc, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .subtitle { font-size: 14px; color: #64748b; margin-bottom: 40px; line-height: 1.6; }
        .footer { color: #334155; font-size: 12px; line-height: 1.8; }
        .footer a { color: #475569; text-decoration: none; border-bottom: 1px solid rgba(71,85,105,0.3); transition: color 0.2s; }
        .footer a:hover { color: #fb923c; }
        .particle { position: fixed; width: 2px; height: 2px; background: rgba(234,88,12,0.3); border-radius: 50%; z-index: 0; animation: float linear infinite; }
        @keyframes float { 0% { transform: translateY(100vh) scale(0); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(-10vh) scale(1); opacity: 0; } }
    </style>
</head>
<body>
    <div class="particle" style="left:10%;animation-duration:18s;animation-delay:0s;"></div>
    <div class="particle" style="left:30%;animation-duration:22s;animation-delay:3s;width:3px;height:3px;"></div>
    <div class="particle" style="left:50%;animation-duration:16s;animation-delay:6s;"></div>
    <div class="particle" style="left:70%;animation-duration:20s;animation-delay:5s;"></div>
    <div class="particle" style="left:90%;animation-duration:19s;animation-delay:8s;width:3px;height:3px;"></div>

    <div class="container">
        <div class="logo-mark">
            <div class="logo-ring"></div>
            <div class="logo-ring"></div>
            <div class="logo-ring"></div>
            <div class="logo-inner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
                </svg>
            </div>
        </div>

        <div class="badge"><span class="badge-dot"></span>Operational</div>

        <h1>PrimeX Ventures</h1>
        <p class="subtitle">
            Government Technology Infrastructure
        </p>

        <div class="footer">
            <a href="https://primex.ventures">PrimeX Ventures Inc.</a><br>
            &copy; {{ date("Y") }} All Rights Reserved.
        </div>
    </div>
</body>
</html>
