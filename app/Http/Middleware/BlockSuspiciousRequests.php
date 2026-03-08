<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Block automated scanners, bots, and requests to known attack paths.
 *
 * Government platforms are constant targets for automated vulnerability
 * scanners. This middleware rejects them early before they hit routing.
 */
class BlockSuspiciousRequests
{
    /**
     * User-Agent substrings used by common vulnerability scanners.
     * Case-insensitive match.
     */
    private const BLOCKED_USER_AGENTS = [
        'sqlmap',
        'nikto',
        'nmap',
        'masscan',
        'zgrab',
        'gobuster',
        'dirbuster',
        'wpscan',
        'nuclei',
        'httpx',
        'censys',
        'shodan',
        'nessus',
        'openvas',
        'burpsuite',
        'hydra',
        'metasploit',
        'acunetix',
        'netsparker',
        'qualys',
        'arachni',
    ];

    /**
     * URL path prefixes that indicate probing for common vulnerabilities.
     * Normalized to lowercase for comparison.
     */
    private const BLOCKED_PATHS = [
        '.env',
        '.git',
        '.svn',
        '.htaccess',
        '.htpasswd',
        '.DS_Store',
        'wp-admin',
        'wp-login',
        'wp-content',
        'wp-includes',
        'wordpress',
        'phpmyadmin',
        'pma',
        'adminer',
        'phpinfo',
        'server-status',
        'server-info',
        'cgi-bin',
        'xmlrpc.php',
        'eval-stdin.php',
        'vendor/phpunit',
        'telescope',
        'horizon',
        '_ignition',
        'debug',
        'console',
        'shell',
        'cmd',
        'admin.php',
        'install.php',
        'setup.php',
        'config.php',
        'database.sql',
        'db.sql',
        'backup',
        '.bak',
        '.old',
        '.orig',
        '.sql',
        '.tar',
        '.zip',
        '.gz',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        // Block requests with no User-Agent (automated tools often omit it)
        $userAgent = $request->userAgent();
        if ($userAgent === null || $userAgent === '') {
            $this->logBlocked($request, 'empty_user_agent');

            return response()->json(['message' => 'Forbidden.'], 403);
        }

        // Block known scanner/bot user agents
        $userAgentLower = strtolower($userAgent);
        foreach (self::BLOCKED_USER_AGENTS as $blocked) {
            if (str_contains($userAgentLower, $blocked)) {
                $this->logBlocked($request, "scanner:{$blocked}");

                return response()->json(['message' => 'Forbidden.'], 403);
            }
        }

        // Block requests to common attack/probe paths
        $path = strtolower(ltrim($request->path(), '/'));
        foreach (self::BLOCKED_PATHS as $blockedPath) {
            $normalizedBlocked = strtolower(ltrim($blockedPath, '.'));
            if (str_starts_with($path, strtolower($blockedPath))
                || str_contains($path, '/'.strtolower($blockedPath))) {
                $this->logBlocked($request, "path:{$blockedPath}");

                return response()->json(['message' => 'Forbidden.'], 403);
            }
        }

        return $next($request);
    }

    /**
     * Log blocked request details for security monitoring.
     */
    private function logBlocked(Request $request, string $reason): void
    {
        Log::warning('Blocked suspicious request', [
            'reason' => $reason,
            'ip' => $request->ip(),
            'method' => $request->method(),
            'path' => $request->path(),
            'user_agent' => $request->userAgent(),
        ]);
    }
}
