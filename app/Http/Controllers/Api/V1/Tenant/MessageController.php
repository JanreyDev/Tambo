<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    /**
     * List messages in a folder for the authenticated user.
     * GET /api/v1/messages?folder=inbox&search=...
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $folder = $request->get('folder', 'inbox');
        $search = $request->get('search');

        $query = Message::where('barangay_id', $user->barangay_id)
            ->where(function ($q) use ($user, $folder) {
                if ($folder === 'sent') {
                    $q->where('from_user_id', $user->id)->where('folder', 'sent');
                } elseif ($folder === 'draft') {
                    $q->where('from_user_id', $user->id)->where('is_draft', true);
                } else {
                    // inbox, starred, archive, trash — scoped to recipient
                    $q->where('to_user_id', $user->id)->where('folder', $folder);
                }
            })
            ->whereNull('deleted_at');

        if ($folder === 'starred') {
            $query->where('is_starred', true);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('subject', 'ilike', "%{$search}%")
                    ->orWhere('body', 'ilike', "%{$search}%");
            });
        }

        $query->orderByDesc('created_at');

        $perPage = min((int) $request->get('per_page', 25), 100);

        $messages = $query->paginate($perPage)->through(function ($m) {
            return [
                'id' => $m->id,
                'subject' => $m->subject,
                'body_preview' => mb_substr(strip_tags($m->body), 0, 150),
                'from_user_id' => $m->from_user_id,
                'from_name' => $m->fromUser?->full_name ?? 'Barangay System',
                'to_user_id' => $m->to_user_id,
                'is_read' => $m->is_read,
                'is_starred' => $m->is_starred,
                'is_draft' => $m->is_draft,
                'folder' => $m->folder,
                'attachments' => $m->attachments ?? [],
                'sent_at' => $m->sent_at,
                'created_at' => $m->created_at,
            ];
        });

        // Unread count
        $unreadCount = Message::where('barangay_id', $user->barangay_id)
            ->where('to_user_id', $user->id)
            ->where('folder', 'inbox')
            ->where('is_read', false)
            ->count();

        return response()->json([
            'messages' => $messages,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Get a single message (marks as read).
     * GET /api/v1/messages/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $message = Message::where('barangay_id', $user->barangay_id)
            ->where(function ($q) use ($user) {
                $q->where('to_user_id', $user->id)
                    ->orWhere('from_user_id', $user->id);
            })
            ->findOrFail($id);

        // Mark as read when recipient views
        if ($message->to_user_id === $user->id && !$message->is_read) {
            $message->update(['is_read' => true]);
        }

        return response()->json(['message' => $message->load('fromUser:id,first_name,last_name', 'toUser:id,first_name,last_name')]);
    }

    /**
     * Send a new message or save draft.
     * POST /api/v1/messages
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'to_user_id' => ['nullable', 'uuid', 'exists:users,id'],
            'to_address' => ['nullable', 'string', 'max:255'],
            'subject' => ['required', 'string', 'max:500'],
            'body' => ['required', 'string'],
            'is_draft' => ['boolean'],
            'attachments' => ['nullable', 'array'],
            'parent_message_id' => ['nullable', 'uuid', 'exists:messages,id'],
        ]);

        $user = $request->user();
        $isDraft = $validated['is_draft'] ?? false;

        $message = Message::create([
            'barangay_id' => $user->barangay_id,
            'from_user_id' => $user->id,
            'to_user_id' => $validated['to_user_id'] ?? null,
            'to_address' => $validated['to_address'] ?? null,
            'subject' => $validated['subject'],
            'body' => $validated['body'],
            'is_draft' => $isDraft,
            'folder' => $isDraft ? 'draft' : 'sent',
            'sent_at' => $isDraft ? null : now(),
            'attachments' => $validated['attachments'] ?? null,
            'parent_message_id' => $validated['parent_message_id'] ?? null,
        ]);

        // Create inbox copy for recipient (if internal user)
        if (!$isDraft && isset($validated['to_user_id'])) {
            Message::create([
                'barangay_id' => $user->barangay_id,
                'from_user_id' => $user->id,
                'to_user_id' => $validated['to_user_id'],
                'subject' => $validated['subject'],
                'body' => $validated['body'],
                'is_draft' => false,
                'folder' => 'inbox',
                'sent_at' => now(),
                'attachments' => $validated['attachments'] ?? null,
                'parent_message_id' => $validated['parent_message_id'] ?? null,
            ]);
        }

        return response()->json(['message' => $message], 201);
    }

    /**
     * Update message state (star, move folder, mark read).
     * PATCH /api/v1/messages/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $message = Message::where('barangay_id', $user->barangay_id)
            ->where(function ($q) use ($user) {
                $q->where('to_user_id', $user->id)
                    ->orWhere('from_user_id', $user->id);
            })
            ->findOrFail($id);

        $validated = $request->validate([
            'is_read' => ['boolean'],
            'is_starred' => ['boolean'],
            'folder' => ['string', 'in:inbox,archive,trash,starred'],
            // Allow updating draft body/subject
            'subject' => ['sometimes', 'string', 'max:500'],
            'body' => ['sometimes', 'string'],
            'is_draft' => ['boolean'],
        ]);

        // If sending a saved draft
        if (isset($validated['is_draft']) && !$validated['is_draft'] && $message->is_draft) {
            $validated['folder'] = 'sent';
            $validated['sent_at'] = now();
        }

        $message->update($validated);

        return response()->json(['message' => $message->fresh()]);
    }

    /**
     * Soft delete (move to trash or permanent delete from trash).
     * DELETE /api/v1/messages/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $message = Message::where('barangay_id', $user->barangay_id)
            ->where(function ($q) use ($user) {
                $q->where('to_user_id', $user->id)
                    ->orWhere('from_user_id', $user->id);
            })
            ->findOrFail($id);

        if ($message->folder === 'trash') {
            $message->forceDelete(); // Permanent delete from trash
        } else {
            $message->update(['folder' => 'trash']);
        }

        return response()->json(['message' => 'Deleted.']);
    }

    /**
     * List barangay users for compose autocomplete.
     * GET /api/v1/messages/users
     */
    public function users(Request $request): JsonResponse
    {
        $users = \App\Models\User::where('barangay_id', $request->user()->barangay_id)
            ->where('id', '!=', $request->user()->id)
            ->select('id', 'first_name', 'last_name', 'username', 'role_id')
            ->orderBy('first_name')
            ->get()
            ->map(fn($u) => [
                'id' => $u->id,
                'full_name' => trim("{$u->first_name} {$u->last_name}"),
                'username' => $u->username,
            ]);

        return response()->json(['users' => $users]);
    }
}
