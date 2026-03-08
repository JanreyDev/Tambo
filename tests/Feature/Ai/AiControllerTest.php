<?php

declare(strict_types=1);

use App\Models\Admin\Barangay;
use App\Models\Platform\AiConversation;
use App\Models\User;

beforeEach(function () {
    $this->barangay = Barangay::factory()->create([
        'ai_credit_balance' => 100.00,
    ]);

    $this->user = User::factory()->create([
        'barangay_id' => $this->barangay->id,
    ]);

    $this->token = $this->user->createToken('test')->plainTextToken;
});

test('credits endpoint returns balance and stats', function () {
    $response = $this->withToken($this->token)
        ->getJson('/api/v1/ai/credits');

    $response->assertOk()
        ->assertJsonStructure([
            'balance',
            'estimated_cost_per_message',
            'estimated_messages_remaining',
            'total_used_by_barangay',
            'total_used_by_user',
            'conversation_count',
        ]);

    expect((float) $response->json('balance'))->toBe(100.0);
    expect($response->json('estimated_cost_per_message'))->toBeGreaterThan(0);
});

test('list conversations returns only current user conversations', function () {
    // Create conversation for current user
    AiConversation::create([
        'barangay_id' => $this->barangay->id,
        'user_id' => $this->user->id,
        'title' => 'My conversation',
        'messages' => [],
        'status' => 'active',
    ]);

    // Create conversation for different user
    $otherUser = User::factory()->create(['barangay_id' => $this->barangay->id]);
    AiConversation::create([
        'barangay_id' => $this->barangay->id,
        'user_id' => $otherUser->id,
        'title' => 'Other user conversation',
        'messages' => [],
        'status' => 'active',
    ]);

    $response = $this->withToken($this->token)
        ->getJson('/api/v1/ai/conversations');

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.title'))->toBe('My conversation');
});

test('show conversation returns 403 for another user conversation', function () {
    $otherUser = User::factory()->create(['barangay_id' => $this->barangay->id]);
    $conversation = AiConversation::create([
        'barangay_id' => $this->barangay->id,
        'user_id' => $otherUser->id,
        'messages' => [],
        'status' => 'active',
    ]);

    $response = $this->withToken($this->token)
        ->getJson("/api/v1/ai/conversations/{$conversation->id}");

    $response->assertForbidden();
});

test('create conversation returns 402 when credits insufficient', function () {
    $this->barangay->update(['ai_credit_balance' => 0.00]);

    $response = $this->withToken($this->token)
        ->postJson('/api/v1/ai/conversations', [
            'message' => 'Hello Mabini',
        ]);

    $response->assertStatus(402)
        ->assertJsonFragment(['message' => 'Insufficient AI credits.']);
});

test('create conversation validates message is required', function () {
    $response = $this->withToken($this->token)
        ->postJson('/api/v1/ai/conversations', []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors('message');
});

test('create conversation validates message max length', function () {
    $response = $this->withToken($this->token)
        ->postJson('/api/v1/ai/conversations', [
            'message' => str_repeat('a', 2001),
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors('message');
});

test('delete conversation archives it', function () {
    $conversation = AiConversation::create([
        'barangay_id' => $this->barangay->id,
        'user_id' => $this->user->id,
        'messages' => [],
        'status' => 'active',
    ]);

    $response = $this->withToken($this->token)
        ->deleteJson("/api/v1/ai/conversations/{$conversation->id}");

    $response->assertOk();
    expect($conversation->fresh()->status)->toBe('archived');
});

test('delete conversation returns 403 for another user', function () {
    $otherUser = User::factory()->create(['barangay_id' => $this->barangay->id]);
    $conversation = AiConversation::create([
        'barangay_id' => $this->barangay->id,
        'user_id' => $otherUser->id,
        'messages' => [],
        'status' => 'active',
    ]);

    $response = $this->withToken($this->token)
        ->deleteJson("/api/v1/ai/conversations/{$conversation->id}");

    $response->assertForbidden();
});

test('archived conversations do not appear in listing', function () {
    AiConversation::create([
        'barangay_id' => $this->barangay->id,
        'user_id' => $this->user->id,
        'title' => 'Active one',
        'messages' => [],
        'status' => 'active',
    ]);

    AiConversation::create([
        'barangay_id' => $this->barangay->id,
        'user_id' => $this->user->id,
        'title' => 'Archived one',
        'messages' => [],
        'status' => 'archived',
    ]);

    $response = $this->withToken($this->token)
        ->getJson('/api/v1/ai/conversations');

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.title'))->toBe('Active one');
});

test('send message to archived conversation returns 422', function () {
    $conversation = AiConversation::create([
        'barangay_id' => $this->barangay->id,
        'user_id' => $this->user->id,
        'messages' => [],
        'status' => 'archived',
    ]);

    $response = $this->withToken($this->token)
        ->postJson("/api/v1/ai/conversations/{$conversation->id}/messages", [
            'message' => 'Hello',
        ]);

    $response->assertUnprocessable();
});

test('unauthenticated request returns 401', function () {
    $this->getJson('/api/v1/ai/credits')->assertUnauthorized();
    $this->getJson('/api/v1/ai/conversations')->assertUnauthorized();
    $this->postJson('/api/v1/ai/conversations', ['message' => 'hi'])->assertUnauthorized();
});
