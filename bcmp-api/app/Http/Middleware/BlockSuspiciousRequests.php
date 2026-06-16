<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks automated scanners, bots, and requests to common attack paths.
 *
 * This runs before any routing, so attack probes never reach controllers.
 * Blocked attempts are logged for incident response and pattern analysis.
 */
class BlockSuspiciousRequests
{
    /**
     * User-Agent substrings that indicate automated scanning tools.
     * Case-insensitive matching.
     */
    private const BLOCKED_USER_AGENTS = [
        'sqlmap',
        'nikto',
        'nmap',
        'masscan',
        'zgrab',
        'gobuster',
        'dirbuster',
        'wfuzz',
        'hydra',
        'nessus',
        'openvas',
        'burpsuite',
        'metasploit',
        'w3af',
        'acunetix',
        'netsparker',
        'arachni',
        'skipfish',
        'whatweb',
        'nuclei',
        'httprobe',
        'subfinder',
        'ffuf',
        'feroxbuster',
        'curl/', // bare curl without custom UA (legitimate clients set a proper UA)
    ];

    /**
     * URL path segments that indicate attack probes.
     * Matched against the request path (case-insensitive).
     */
    private const BLOCKED_PATHS = [
        // Environment and config files
        '.env',
        '.git',
        '.svn',
        '.htaccess',
        '.htpasswd',
        '.DS_Store',
        'web.config',
        '.aws',
        '.ssh',

        // WordPress / CMS probes
        'wp-admin',
        'wp-login',
        'wp-content',
        'wp-includes',
        'wp-config',
        'wordpress',
        'xmlrpc.php',

        // Database admin tools
        'phpmyadmin',
        'pma',
        'adminer',
        'myadmin',
        'mysql',
        'pgadmin',
        'dbadmin',

        // PHP info / debug
        'phpinfo',
        'info.php',
        'test.php',
        'debug.php',
        'phpunit',

        // Shell / backdoor probes
        'shell',
        'cmd',
        'console',
        'terminal',
        'eval-stdin',
        'backdoor',

        // Server management probes
        'server-status',
        'server-info',
        'cpanel',
        'webmail',
        'cgi-bin',

        // Common exploit paths
        'vendor/phpunit',
        'vendor/autoload',
        'telescope',
        'horizon',
        '_debugbar',
        'elmah.axd',
        'trace.axd',

        // Config file probes
        'config.json',
        'config.yml',
        'config.yaml',
        'database.yml',
        'credentials',
        'secrets',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        // Block requests with no User-Agent header.
        // Legitimate browsers and API clients always send one.
        $userAgent = $request->userAgent();
        if (empty($userAgent)) {
            $this->logBlocked($request, 'empty_user_agent');

            return $this->blockedResponse();
        }

        // Block known scanner/bot user agents
        $userAgentLower = strtolower($userAgent);
        foreach (self::BLOCKED_USER_AGENTS as $blockedAgent) {
            if (str_contains($userAgentLower, strtolower($blockedAgent))) {
                $this->logBlocked($request, 'blocked_user_agent', $blockedAgent);

                return $this->blockedResponse();
            }
        }

        // Block requests to known attack/probe paths
        $path = strtolower($request->path());
        foreach (self::BLOCKED_PATHS as $blockedPath) {
            if (str_contains($path, strtolower($blockedPath))) {
                $this->logBlocked($request, 'blocked_path', $blockedPath);

                return $this->blockedResponse();
            }
        }

        return $next($request);
    }

    /**
     * Log blocked request for security monitoring.
     *
     * Uses structured JSON logging per PrimeX dev standards.
     * These logs feed into security incident analysis.
     */
    private function logBlocked(Request $request, string $reason, ?string $match = null): void
    {
        Log::warning('Suspicious request blocked', [
            'reason' => $reason,
            'match' => $match,
            'ip' => $request->ip(),
            'method' => $request->method(),
            'path' => $request->path(),
            'user_agent' => $request->userAgent(),
            'referer' => $request->header('Referer'),
        ]);
    }

    /**
     * Generic 403 response that reveals nothing about the application.
     */
    private function blockedResponse(): Response
    {
        return response()->json([
            'message' => 'Forbidden.',
        ], 403);
    }
}
