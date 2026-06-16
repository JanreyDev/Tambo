<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Admin\Barangay;
use App\Models\Platform\AiConversation;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AiService
{
    /**
     * Calculate the PHP peso cost for given token usage.
     * Formula: (raw_cost_usd * usd_to_php) * (1 + markup / 100)
     */
    public static function calculateCost(int $inputTokens, int $outputTokens, ?Barangay $barangay = null, int $webSearchRequests = 0): float
    {
        $inputRate = (float) config('services.anthropic.input_cost_per_million', 1.00);
        $outputRate = (float) config('services.anthropic.output_cost_per_million', 5.00);
        $webSearchRate = (float) config('services.anthropic.web_search_cost_per_request_usd', 0.01);
        $usdToPhp = (float) config('services.anthropic.usd_to_php_rate', 56.00);
        $markupPct = $barangay ? $barangay->getAiMarkup() : (float) config('services.anthropic.markup_percentage', 60.00);

        $rawCostUsd = ($inputTokens * $inputRate / 1_000_000) + ($outputTokens * $outputRate / 1_000_000) + ($webSearchRequests * $webSearchRate);
        $rawCostPhp = $rawCostUsd * $usdToPhp;

        return round($rawCostPhp * (1 + $markupPct / 100), 4);
    }

    /**
     * Estimate the cost of a single message (for UI display).
     * Uses conservative averages: ~800 input tokens, ~400 output tokens.
     */
    public static function estimateMessageCost(?Barangay $barangay = null): float
    {
        return self::calculateCost(800, 400, $barangay);
    }

    /**
     * Check if a barangay has enough credits for at least one message.
     */
    public static function hasMinimumCredits(Barangay $barangay): bool
    {
        return $barangay->hasAiCredits(self::estimateMessageCost($barangay));
    }

    /**
     * Send a message and stream the response via SSE.
     */
    public function streamMessage(
        AiConversation $conversation,
        string $userMessage,
        Barangay $barangay,
        User $user,
    ): StreamedResponse {
        return new StreamedResponse(function () use ($conversation, $userMessage, $barangay, $user) {
            // Disable output buffering for SSE
            while (ob_get_level()) {
                ob_end_clean();
            }

            $apiKey = config('services.anthropic.api_key');

            if (! $apiKey) {
                Log::warning('Anthropic API key not configured');
                $this->sendSSE('error', [
                    'type' => 'error',
                    'message' => 'AI service is not configured. Please contact the administrator.',
                    'code' => 'api_key_missing',
                ]);

                return;
            }

            // Append user message to conversation
            $conversation->addMessage('user', $userMessage);
            $conversation->save();

            $systemPrompt = $this->buildSystemPrompt($barangay, $user);
            $apiMessages = $conversation->getMessagesForApi();

            // Trim to max conversation messages (keep most recent)
            $maxMessages = (int) config('services.anthropic.max_conversation_messages', 50);
            if (count($apiMessages) > $maxMessages) {
                $apiMessages = array_slice($apiMessages, -$maxMessages);
            }

            $fullResponse = '';
            $inputTokens = 0;
            $outputTokens = 0;
            $webSearchRequests = 0;

            try {
                // Build request payload
                $payload = [
                    'model' => $barangay->getAiModel(),
                    'max_tokens' => (int) config('services.anthropic.max_tokens', 1024),
                    'system' => $systemPrompt,
                    'messages' => $apiMessages,
                    'stream' => true,
                ];

                // Add web search tool if enabled
                if (config('services.anthropic.web_search_enabled', true)) {
                    $payload['tools'] = [
                        [
                            'type' => 'web_search_20250305',
                            'name' => 'web_search',
                            'max_uses' => (int) config('services.anthropic.web_search_max_uses', 3),
                        ],
                    ];
                }

                $response = Http::timeout(120)
                    ->withHeaders([
                        'x-api-key' => $apiKey,
                        'anthropic-version' => '2023-06-01',
                        'Content-Type' => 'application/json',
                    ])
                    ->withOptions(['stream' => true])
                    ->post(config('services.anthropic.base_url').'/v1/messages', $payload);

                if (! $response->successful()) {
                    Log::error('Anthropic API error', [
                        'status' => $response->status(),
                        'body' => $response->body(),
                        'conversation_id' => $conversation->id,
                    ]);

                    // Remove the user message we just added since the API call failed
                    $messages = $conversation->messages;
                    array_pop($messages);
                    $conversation->update(['messages' => $messages]);

                    $this->sendSSE('error', [
                        'type' => 'error',
                        'message' => 'AI service is temporarily unavailable. Please try again.',
                        'code' => 'api_error',
                    ]);

                    return;
                }

                $body = $response->toPsrResponse()->getBody();
                $buffer = '';

                while (! $body->eof()) {
                    $chunk = $body->read(1024);
                    $buffer .= $chunk;

                    // Process complete SSE lines
                    while (($pos = strpos($buffer, "\n")) !== false) {
                        $line = substr($buffer, 0, $pos);
                        $buffer = substr($buffer, $pos + 1);

                        if (! str_starts_with($line, 'data: ')) {
                            continue;
                        }

                        $jsonStr = substr($line, 6);

                        if ($jsonStr === '[DONE]') {
                            continue;
                        }

                        $data = json_decode($jsonStr, true);

                        if (! $data) {
                            continue;
                        }

                        $eventType = $data['type'] ?? '';

                        // Extract input tokens from message_start
                        if ($eventType === 'message_start') {
                            $inputTokens = $data['message']['usage']['input_tokens'] ?? 0;
                        }

                        // Stream text content deltas (skip search query input_json_delta)
                        if ($eventType === 'content_block_delta') {
                            $deltaType = $data['delta']['type'] ?? '';
                            if ($deltaType === 'text_delta') {
                                $text = $data['delta']['text'] ?? '';
                                if ($text !== '') {
                                    $fullResponse .= $text;
                                    $this->sendSSE('content_delta', [
                                        'type' => 'content_delta',
                                        'text' => $text,
                                    ]);
                                }
                            }
                        }

                        // Extract output tokens and web search usage from message_delta
                        if ($eventType === 'message_delta') {
                            $outputTokens = $data['usage']['output_tokens'] ?? 0;
                            $webSearchRequests = $data['usage']['server_tool_use']['web_search_requests'] ?? $webSearchRequests;
                        }
                    }
                }

                // Save assistant response
                $conversation->addMessage('assistant', $fullResponse);

                // Calculate actual cost and deduct credits (includes web search cost)
                $actualCost = self::calculateCost($inputTokens, $outputTokens, $barangay, $webSearchRequests);

                $conversation->update([
                    'tokens_used' => $conversation->tokens_used + $inputTokens + $outputTokens,
                    'input_tokens_used' => $conversation->input_tokens_used + $inputTokens,
                    'output_tokens_used' => $conversation->output_tokens_used + $outputTokens,
                    'credit_cost' => (float) $conversation->credit_cost + $actualCost,
                ]);

                $barangay->deductAiCredit($actualCost);

                // Auto-generate title from first user message
                if (! $conversation->title) {
                    $firstUserMessage = collect($conversation->messages)
                        ->firstWhere('role', 'user');
                    $conversation->update([
                        'title' => Str::limit($firstUserMessage['content'] ?? 'New conversation', 100),
                    ]);
                }

                // Send completion event with usage metadata
                $this->sendSSE('message_complete', [
                    'type' => 'message_complete',
                    'conversation_id' => $conversation->id,
                    'input_tokens' => $inputTokens,
                    'output_tokens' => $outputTokens,
                    'web_search_requests' => $webSearchRequests,
                    'credit_cost' => $actualCost,
                    'remaining_balance' => (float) $barangay->fresh()->ai_credit_balance,
                ]);

                Log::info('Mabini AI message completed', [
                    'conversation_id' => $conversation->id,
                    'barangay_id' => $barangay->id,
                    'user_id' => $user->id,
                    'input_tokens' => $inputTokens,
                    'output_tokens' => $outputTokens,
                    'web_search_requests' => $webSearchRequests,
                    'cost_php' => $actualCost,
                    'remaining_balance' => $barangay->fresh()->ai_credit_balance,
                ]);
            } catch (\Throwable $e) {
                Log::error('Mabini AI stream failed', [
                    'conversation_id' => $conversation->id,
                    'error' => $e->getMessage(),
                    'barangay_id' => $barangay->id,
                    'user_id' => $user->id,
                ]);

                // If we got partial response, still save it but don't charge
                if ($fullResponse !== '') {
                    $conversation->addMessage('assistant', $fullResponse.' [response interrupted]');
                    $conversation->save();
                }

                $this->sendSSE('error', [
                    'type' => 'error',
                    'message' => 'An error occurred while processing your request. No credits were charged.',
                    'code' => 'stream_error',
                ]);
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    /**
     * Build the Mabini system prompt with barangay and user context.
     */
    private function buildSystemPrompt(Barangay $barangay, User $user): string
    {
        $roles = $user->roles->pluck('name')->join(', ') ?: 'Staff';
        $userName = trim("{$user->first_name} {$user->last_name}") ?: $user->username;

        return <<<PROMPT
You are Mabini, the AI assistant for Barangay {$barangay->name}, powered by PrimeX Ventures Inc.

Named after Apolinario Mabini -- the Brains of the Philippine Revolution -- you serve as the intellectual backbone of this barangay's operations.

You are currently speaking with {$userName} ({$roles}).

== Barangay Context ==
Name: {$barangay->name}
Location: {$barangay->full_address}
Population: {$barangay->population}
Land Area: {$barangay->land_area_hectares} hectares

== Your Expertise ==
- Philippine barangay governance and operations
- DILG requirements, compliance reporting, mandates (RA 7160, RA 10173, RA 9262, etc.)
- Resident records, document issuance, barangay clearances, cedulas
- Katarungang Pambarangay (barangay justice system)
- Sangguniang Kabataan (SK) youth council operations
- Barangay budgeting, financial management, procurement
- Disaster risk reduction and management (DRRM)
- Gender and Development (GAD) compliance
- COMELEC voter registration and election processes
- General knowledge on any topic

== Capabilities ==
- You have access to web search. Use it proactively to look up current information such as government officials, news, DILG memorandums, laws, regulations, weather, places, history, and any real-time data the user asks about. Do not hesitate to search -- always provide the best possible answer.

== Rules ==
- You are a knowledgeable, professional assistant. Answer ANY question the user asks to the best of your ability -- general knowledge, other barangays, government topics, personal advice, anything.
- For topics outside your built-in knowledge (current events, government officials, laws, news, weather, other places, etc.), use web search to find accurate, up-to-date information. Always give a useful, complete answer.
- NEVER refuse to answer a question just because it is not about Barangay {$barangay->name}. You are a general-purpose assistant with deep Philippine governance expertise.
- DATA PRIVACY: Each barangay's conversations and records are strictly isolated. Never share, reference, or disclose private data from Barangay {$barangay->name} to users of other barangays, and vice versa. All conversations are confidential to the user and their barangay.
- Never fabricate barangay-specific data about {$barangay->name}. If asked about internal records you don't have access to, explain that direct database queries are coming in a future update.
- Detect the user's language and respond in the same language. You support English, Tagalog, Bisaya/Cebuano, Ilonggo/Hiligaynon, Waray, Kapampangan, Ilocano, Bicolano, Pangasinan, and other Philippine dialects.
- Be concise and practical. Barangay staff need actionable answers.
- Use markdown: **bold**, bullet points, headers for structure.
- Keep responses under 500 words unless the user asks for detail.
- For legal questions, provide general guidance and recommend consulting DILG or legal counsel.
- When using web search results, cite the source so the user can verify.
- Address {$userName} by name when appropriate to build rapport.
PROMPT;
    }

    /**
     * Send a Server-Sent Event to the client.
     */
    private function sendSSE(string $event, array $data): void
    {
        echo "event: {$event}\n";
        echo 'data: '.json_encode($data)."\n\n";

        if (connection_aborted()) {
            return;
        }

        flush();
    }
}
