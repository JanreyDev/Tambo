<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Webhook;

use App\Http\Controllers\Controller;
use App\Services\TelegramService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SentryWebhookController extends Controller
{
    public function __construct(
        private readonly TelegramService $telegram,
    ) {}

    /**
     * Handle incoming Sentry webhook (Internal Integration).
     *
     * POST /api/v1/webhooks/sentry
     */
    public function __invoke(Request $request): JsonResponse
    {
        $action = $request->input('action');
        $data = $request->input('data', []);

        // Sentry sends a verification request on setup
        if ($action === 'installation' || $action === 'verification') {
            return response()->json(['status' => 'ok']);
        }

        // We care about issue alerts (triggered/created)
        if (! in_array($action, ['triggered', 'created', 'resolved'], true)) {
            return response()->json(['status' => 'ignored']);
        }

        $event = $data['event'] ?? [];
        $issue = $data['issue'] ?? $event;

        $title = $issue['title'] ?? $event['title'] ?? 'Unknown Error';
        $project = $data['project']['slug'] ?? $event['project'] ?? 'unknown';
        $url = $issue['web_url'] ?? $data['url'] ?? '';
        $level = $event['level'] ?? $issue['level'] ?? 'error';
        $culprit = $event['culprit'] ?? $issue['culprit'] ?? '';

        // Map level to severity
        $severity = match ($level) {
            'fatal' => 'FATAL',
            'error' => 'ERROR',
            'warning' => 'WARNING',
            default => strtoupper($level),
        };

        // Format Telegram message
        $message = "<b>[SENTRY {$severity}] {$project}</b>\n\n"
            ."<b>{$this->escapeHtml($title)}</b>\n";

        if ($culprit !== '') {
            $message .= "<code>{$this->escapeHtml($culprit)}</code>\n";
        }

        if ($url !== '') {
            $message .= "\n<a href=\"{$url}\">View in Sentry</a>";
        }

        $sent = $this->telegram->sendMessage($message);

        Log::info('Sentry webhook processed', [
            'action' => $action,
            'project' => $project,
            'title' => $title,
            'telegram_sent' => $sent,
        ]);

        return response()->json(['status' => 'ok', 'telegram_sent' => $sent]);
    }

    private function escapeHtml(string $text): string
    {
        return htmlspecialchars($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
}
