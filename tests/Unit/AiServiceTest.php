<?php

declare(strict_types=1);

use App\Services\AiService;

uses(Tests\TestCase::class);

test('calculateCost returns correct PHP peso cost with 60% markup', function () {
    // 1000 input tokens + 500 output tokens
    // Input: 1000 * 1.00 / 1_000_000 = 0.001 USD
    // Output: 500 * 5.00 / 1_000_000 = 0.0025 USD
    // Raw: 0.0035 USD * 56 PHP/USD = 0.196 PHP
    // With 60% markup: 0.196 * 1.60 = 0.3136 PHP
    $cost = AiService::calculateCost(1000, 500);
    expect($cost)->toBe(0.3136);
});

test('calculateCost returns zero for zero tokens', function () {
    $cost = AiService::calculateCost(0, 0);
    expect($cost)->toBe(0.0);
});

test('estimateMessageCost returns a positive value', function () {
    $cost = AiService::estimateMessageCost();
    expect($cost)->toBeGreaterThan(0);
});

test('estimateMessageCost uses 800 input and 400 output tokens', function () {
    $estimated = AiService::estimateMessageCost();
    $manual = AiService::calculateCost(800, 400);
    expect($estimated)->toBe($manual);
});
