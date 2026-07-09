<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'browsershot' => [
        // Absolute paths to the Node binary and Chromium executable used to render
        // ID card PDFs via headless Chromium. Defaults point to the project-local
        // copies in base_path('browser') so they're reachable by the web user.
        'node_binary' => env('BROWSERSHOT_NODE_BINARY'),
        'chrome_path' => env('BROWSERSHOT_CHROME_PATH'),
    ],

    'txtbox' => [
        'api_key' => env('TXTBOX_API_KEY'),
        'url' => env('TXTBOX_URL', 'https://ws-v2.txtbox.com/messaging/v1/sms/push'),
    ],

    'anthropic' => [
        'api_key' => env('ANTHROPIC_API_KEY'),
        'base_url' => env('ANTHROPIC_BASE_URL', 'https://api.anthropic.com'),
        'model' => env('ANTHROPIC_MODEL', 'claude-haiku-4-5-20251001'),
        'max_tokens' => (int) env('ANTHROPIC_MAX_TOKENS', 1024),
        'input_cost_per_million' => (float) env('ANTHROPIC_INPUT_COST_USD', 1.00),
        'output_cost_per_million' => (float) env('ANTHROPIC_OUTPUT_COST_USD', 5.00),
        'usd_to_php_rate' => (float) env('AI_USD_TO_PHP_RATE', 56.00),
        'markup_percentage' => (float) env('AI_MARKUP_PERCENTAGE', 60.00),
        'max_conversation_messages' => (int) env('AI_MAX_CONVERSATION_MESSAGES', 50),
        'max_input_length' => (int) env('AI_MAX_INPUT_LENGTH', 2000),
        'web_search_enabled' => (bool) env('AI_WEB_SEARCH_ENABLED', true),
        'web_search_max_uses' => (int) env('AI_WEB_SEARCH_MAX_USES', 3),
        'web_search_cost_per_request_usd' => (float) env('AI_WEB_SEARCH_COST_USD', 0.01),
    ],

];
