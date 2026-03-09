<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Founder\MabiniConversation;
use App\Models\Founder\SystemAlert;
use App\Models\ProductConnection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MabiniFounderService
{
    private string $apiKey;

    private string $apiUrl = 'https://api.anthropic.com/v1/messages';

    private DigitalOceanService $digitalOcean;

    private CloudflareService $cloudflare;

    public function __construct(
        DigitalOceanService $digitalOcean,
        CloudflareService $cloudflare,
    ) {
        $this->apiKey = (string) config('services.anthropic.api_key');
        $this->digitalOcean = $digitalOcean;
        $this->cloudflare = $cloudflare;
    }

    /**
     * Chat with Mabini AI for founder operations.
     *
     * @return array<string, mixed>
     */
    public function chat(string $message, ?string $conversationId = null): array
    {
        $conversation = $conversationId
            ? MabiniConversation::find($conversationId)
            : MabiniConversation::create(['messages' => [], 'context' => null]);

        if ($conversation === null) {
            $conversation = MabiniConversation::create(['messages' => [], 'context' => null]);
        }

        // Append user message.
        $conversation->addMessage('user', $message);

        // Build the messages array for Anthropic API.
        $apiMessages = collect($conversation->messages)
            ->map(fn (array $msg) => [
                'role' => $msg['role'],
                'content' => $msg['content'],
            ])
            ->all();

        $systemPrompt = $this->buildSystemPrompt();
        $tools = $this->getToolDefinitions();

        try {
            $responseData = $this->callAnthropicApi($systemPrompt, $apiMessages, $tools);

            // Process tool use if present.
            $maxToolRounds = 5;
            $currentRound = 0;

            while ($currentRound < $maxToolRounds && $this->hasToolUse($responseData)) {
                $toolResults = $this->processToolUse($responseData);

                // Append the assistant message with tool_use blocks.
                $apiMessages[] = [
                    'role' => 'assistant',
                    'content' => $responseData['content'],
                ];

                // Append tool results.
                $apiMessages[] = [
                    'role' => 'user',
                    'content' => $toolResults,
                ];

                $responseData = $this->callAnthropicApi($systemPrompt, $apiMessages, $tools);
                $currentRound++;
            }

            // Extract the final text response.
            $assistantMessage = $this->extractTextContent($responseData);

            $conversation->addMessage('assistant', $assistantMessage);

            return [
                'conversation_id' => $conversation->id,
                'message' => $assistantMessage,
                'model' => $responseData['model'] ?? 'unknown',
                'usage' => $responseData['usage'] ?? null,
            ];
        } catch (\Exception $e) {
            Log::error('Mabini AI: chat request failed', [
                'conversation_id' => $conversation->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'conversation_id' => $conversation->id,
                'message' => 'I encountered an error processing your request. Please try again.',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Generate automated insights from current system state.
     *
     * @return array<string, mixed>
     */
    public function generateInsights(): array
    {
        $systemState = $this->gatherSystemState();

        $systemPrompt = <<<'PROMPT'
You are Mabini, the AI operations analyst for PrimeX Ventures.
Analyze the provided system state and generate actionable insights.
Focus on: anomalies, cost optimization, security concerns, performance issues, and capacity planning.
Return a JSON array of insights, each with: title, severity (info/warning/critical), description, recommendation.
Return ONLY the JSON array, no other text.
PROMPT;

        $messages = [
            [
                'role' => 'user',
                'content' => "Analyze this system state and generate insights:\n\n".json_encode($systemState, JSON_PRETTY_PRINT),
            ],
        ];

        try {
            $responseData = $this->callAnthropicApi($systemPrompt, $messages, []);
            $responseText = $this->extractTextContent($responseData);

            // Parse the JSON response.
            $insights = json_decode($responseText, true);

            if (! is_array($insights)) {
                Log::warning('Mabini AI: insight generation returned non-JSON', [
                    'response' => $responseText,
                ]);

                return [];
            }

            // Store each insight as a system alert.
            foreach ($insights as $insight) {
                SystemAlert::create([
                    'severity' => $insight['severity'] ?? 'info',
                    'source' => 'mabini',
                    'title' => $insight['title'] ?? 'AI Insight',
                    'description' => $insight['description'] ?? '',
                    'metadata' => [
                        'recommendation' => $insight['recommendation'] ?? null,
                        'generated_at' => now()->toIso8601String(),
                    ],
                    'created_at' => now(),
                ]);
            }

            return $insights;
        } catch (\Exception $e) {
            Log::error('Mabini AI: insight generation failed', [
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * Build the system prompt with current infrastructure context.
     */
    private function buildSystemPrompt(): string
    {
        return <<<'PROMPT'
You are Mabini, the AI assistant for the PrimeX Ventures Command Center.
You are speaking directly with Jeager, the founder and CEO.

Your role:
- Monitor and report on PrimeX infrastructure (DigitalOcean droplets, databases, Cloudflare domains)
- Track product health across all PrimeX products (BCMP, LGMP, PDMP, SPACALL, Barangaymo)
- Analyze system metrics and alert on anomalies
- Provide cost optimization recommendations
- Security monitoring and threat assessment

Context:
- PrimeX builds government technology for Philippine LGUs (Local Government Units)
- Products: BCMP (kapitan.ph), LGMP (tarlac.ph), PDMP, SPACALL (spacall.ph), Barangaymo (barangaymo.com)
- Infrastructure: DigitalOcean droplets in SGP1, Cloudflare DNS, GitLab CI/CD
- All staging uses primex.ventures subdomains
- Pulitika (pulitika.ph) is the centralized admin dashboard

Be direct, technical, and actionable. No fluff. Use Filipino government terminology where relevant.
When using tools, gather data before forming conclusions.
PROMPT;
    }

    /**
     * Get tool definitions for Anthropic API tool_use.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getToolDefinitions(): array
    {
        return [
            [
                'name' => 'get_droplet_status',
                'description' => 'Get the current status and resource usage of all DigitalOcean droplets.',
                'input_schema' => [
                    'type' => 'object',
                    'properties' => (object) [],
                    'required' => [],
                ],
            ],
            [
                'name' => 'get_product_health',
                'description' => 'Check the health status of all PrimeX product API connections.',
                'input_schema' => [
                    'type' => 'object',
                    'properties' => (object) [],
                    'required' => [],
                ],
            ],
            [
                'name' => 'get_recent_alerts',
                'description' => 'Get recent system alerts, optionally filtered by severity.',
                'input_schema' => [
                    'type' => 'object',
                    'properties' => [
                        'severity' => [
                            'type' => 'string',
                            'description' => 'Filter by severity: critical, warning, info',
                            'enum' => ['critical', 'warning', 'info'],
                        ],
                        'limit' => [
                            'type' => 'integer',
                            'description' => 'Number of alerts to return (default: 20)',
                        ],
                    ],
                    'required' => [],
                ],
            ],
            [
                'name' => 'get_database_status',
                'description' => 'Get the status of all DigitalOcean managed databases.',
                'input_schema' => [
                    'type' => 'object',
                    'properties' => (object) [],
                    'required' => [],
                ],
            ],
        ];
    }

    /**
     * Check if the API response contains tool_use blocks.
     *
     * @param  array<string, mixed>  $responseData
     */
    private function hasToolUse(array $responseData): bool
    {
        if (($responseData['stop_reason'] ?? '') !== 'tool_use') {
            return false;
        }

        foreach ($responseData['content'] ?? [] as $block) {
            if (($block['type'] ?? '') === 'tool_use') {
                return true;
            }
        }

        return false;
    }

    /**
     * Process tool_use blocks and return tool_result blocks.
     *
     * @param  array<string, mixed>  $responseData
     * @return array<int, array<string, mixed>>
     */
    private function processToolUse(array $responseData): array
    {
        $results = [];

        foreach ($responseData['content'] ?? [] as $block) {
            if (($block['type'] ?? '') !== 'tool_use') {
                continue;
            }

            $toolName = $block['name'];
            $toolInput = $block['input'] ?? [];
            $toolUseId = $block['id'];

            $result = $this->executeTool($toolName, $toolInput);

            $results[] = [
                'type' => 'tool_result',
                'tool_use_id' => $toolUseId,
                'content' => json_encode($result),
            ];
        }

        return $results;
    }

    /**
     * Execute a tool and return its result.
     *
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    private function executeTool(string $toolName, array $input): array
    {
        return match ($toolName) {
            'get_droplet_status' => $this->digitalOcean->getDroplets(),
            'get_product_health' => $this->getProductHealth(),
            'get_recent_alerts' => $this->getRecentAlerts(
                $input['severity'] ?? null,
                $input['limit'] ?? 20,
            ),
            'get_database_status' => $this->digitalOcean->getDatabases(),
            default => ['error' => "Unknown tool: {$toolName}"],
        };
    }

    /**
     * Get product health statuses for tool use.
     *
     * @return array<string, mixed>
     */
    private function getProductHealth(): array
    {
        $connections = ProductConnection::where('status', '!=', 'inactive')->get();

        $results = [];
        foreach ($connections as $connection) {
            $healthStatus = 'unknown';
            $responseTime = null;

            try {
                $startTime = microtime(true);
                $response = Http::timeout(5)
                    ->withToken($connection->api_token)
                    ->get("{$connection->api_base_url}/up");
                $responseTime = round((microtime(true) - $startTime) * 1000);
                $healthStatus = $response->successful() ? 'healthy' : 'unhealthy';
            } catch (\Exception $e) {
                $healthStatus = 'error';
            }

            $results[] = [
                'product' => $connection->product_name,
                'slug' => $connection->product_slug,
                'status' => $healthStatus,
                'response_time_ms' => $responseTime,
            ];
        }

        return ['products' => $results];
    }

    /**
     * Get recent alerts for tool use.
     *
     * @return array<string, mixed>
     */
    private function getRecentAlerts(?string $severity, int $limit): array
    {
        $query = SystemAlert::orderByDesc('created_at')->limit($limit);

        if ($severity !== null) {
            $query->where('severity', $severity);
        }

        return [
            'alerts' => $query->get()->map(fn (SystemAlert $alert) => [
                'severity' => $alert->severity,
                'source' => $alert->source,
                'title' => $alert->title,
                'description' => $alert->description,
                'resolved' => $alert->resolved_at !== null,
                'created_at' => $alert->created_at?->toIso8601String(),
            ])->all(),
        ];
    }

    /**
     * Gather current system state for insight generation.
     *
     * @return array<string, mixed>
     */
    private function gatherSystemState(): array
    {
        return [
            'droplets' => $this->digitalOcean->getDroplets(),
            'databases' => $this->digitalOcean->getDatabases(),
            'products' => $this->getProductHealth(),
            'unresolved_alerts' => SystemAlert::unresolved()
                ->orderByDesc('created_at')
                ->limit(50)
                ->get()
                ->toArray(),
        ];
    }

    /**
     * Call the Anthropic Messages API.
     *
     * @param  array<int, array<string, mixed>>  $messages
     * @param  array<int, array<string, mixed>>  $tools
     * @return array<string, mixed>
     */
    private function callAnthropicApi(string $systemPrompt, array $messages, array $tools): array
    {
        $payload = [
            'model' => 'claude-sonnet-4-20250514',
            'max_tokens' => 4096,
            'system' => $systemPrompt,
            'messages' => $messages,
        ];

        if (! empty($tools)) {
            $payload['tools'] = $tools;
        }

        $response = Http::timeout(30)
            ->withHeaders([
                'x-api-key' => $this->apiKey,
                'anthropic-version' => '2023-06-01',
                'content-type' => 'application/json',
            ])
            ->post($this->apiUrl, $payload);

        if ($response->failed()) {
            Log::error('Anthropic API: request failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new \RuntimeException("Anthropic API error: HTTP {$response->status()}");
        }

        return $response->json();
    }

    /**
     * Extract text content from Anthropic API response.
     *
     * @param  array<string, mixed>  $responseData
     */
    private function extractTextContent(array $responseData): string
    {
        $textParts = [];

        foreach ($responseData['content'] ?? [] as $block) {
            if (($block['type'] ?? '') === 'text') {
                $textParts[] = $block['text'];
            }
        }

        return implode("\n", $textParts) ?: 'No response generated.';
    }
}
