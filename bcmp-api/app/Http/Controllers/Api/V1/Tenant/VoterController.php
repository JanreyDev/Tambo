<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Resident;
use App\Models\Tenant\Voter;
use App\Services\ComelecPdfParser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class VoterController extends Controller
{
    public function __construct(private readonly ComelecPdfParser $parser) {}

    // ── List ───────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $query = Voter::where('barangay_id', $barangayId)
            ->with('resident:id,first_name,last_name,resident_number');

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'ilike', "%{$search}%")
                    ->orWhere('precinct_number', 'ilike', "%{$search}%")
                    ->orWhere('address', 'ilike', "%{$search}%");
            });
        }

        if ($precinct = $request->get('precinct')) {
            $query->where('precinct_number', $precinct);
        }

        if ($request->boolean('unmatched')) {
            $query->whereNull('resident_id');
        }

        $query->orderBy('last_name')->orderBy('first_name');
        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    // ── Stats ──────────────────────────────────────────────────────────────

    public function stats(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $total = Voter::where('barangay_id', $barangayId)->count();
        $matched = Voter::where('barangay_id', $barangayId)->whereNotNull('resident_id')->count();
        $lastImport = Voter::where('barangay_id', $barangayId)->max('imported_at');

        return response()->json([
            'total' => $total,
            'matched' => $matched,
            'last_import_date' => $lastImport,
        ]);
    }

    // ── Precincts list ─────────────────────────────────────────────────────

    public function precincts(Request $request): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;

        $precincts = Voter::where('barangay_id', $barangayId)
            ->select('precinct_number')
            ->distinct()
            ->orderBy('precinct_number')
            ->pluck('precinct_number');

        return response()->json($precincts);
    }

    // ── Preview (parse PDF, no DB write) ───────────────────────────────────

    public function preview(Request $request): JsonResponse
    {
        ini_set('memory_limit', '512M');

        $request->validate([
            'pdf' => ['required', 'file', 'mimes:pdf', 'max:51200'], // 50MB max
        ]);

        $path = $request->file('pdf')->store('temp/comelec');
        if ($path === false) {
            return response()->json(['message' => 'Failed to save uploaded file. Check storage permissions.'], 500);
        }

        $fullPath = Storage::path($path);
        Log::info('COMELEC preview started', ['path' => $fullPath, 'size' => $request->file('pdf')->getSize()]);

        try {
            $rows = $this->parser->parse($fullPath);

            // Clean up temp file
            Storage::delete($path);

            return response()->json([
                'count' => count($rows),
                'rows' => array_slice($rows, 0, 50), // preview: first 50 rows
                'sample' => array_slice($rows, 0, 5), // sample for display
            ]);
        } catch (\Throwable $e) {
            Storage::delete($path);
            Log::error('COMELEC PDF parse failed', ['error' => $e->getMessage()]);

            return response()->json(['message' => 'Failed to parse PDF: '.$e->getMessage()], 422);
        }
    }

    // ── Import (delete old batch, insert new, match residents) ─────────────

    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'pdf' => ['required', 'file', 'mimes:pdf', 'max:51200'],
        ]);

        ini_set('memory_limit', '512M');
        set_time_limit(300);

        $barangayId = $request->user()->barangay_id;
        $path = $request->file('pdf')->store('temp/comelec');

        if ($path === false) {
            return response()->json(['message' => 'Failed to store uploaded PDF.'], 500);
        }

        $fullPath = Storage::path($path);

        try {
            $rows = $this->parser->parse($fullPath);
            Storage::delete($path);

            if (count($rows) === 0) {
                return response()->json(['message' => 'No voter records found in this PDF.'], 422);
            }

            $importedAt = now();
            $matchedCount = 0;
            $insertData = [];

            // Pre-load all residents for matching (name index: lowercase "lastname|firstname")
            $residentIndex = $this->buildResidentIndex($barangayId);

            foreach ($rows as $row) {
                $residentId = null;
                $matchedAt = null;

                // Match by last_name + first_name (case-insensitive)
                $key = $this->nameKey($row['last_name'], $row['first_name']);
                if (isset($residentIndex[$key])) {
                    // If multiple matches, try to narrow by middle name
                    $candidates = $residentIndex[$key];
                    if (count($candidates) === 1) {
                        $residentId = $candidates[0]['id'];
                    } elseif ($row['middle_name']) {
                        $middleKey = $this->nameKey($row['last_name'], $row['first_name'], $row['middle_name']);
                        foreach ($candidates as $c) {
                            if ($c['middle_key'] === $middleKey) {
                                $residentId = $c['id'];
                                break;
                            }
                        }
                        // If still no exact match, take first candidate
                        if (! $residentId) {
                            $residentId = $candidates[0]['id'];
                        }
                    } else {
                        $residentId = $candidates[0]['id'];
                    }

                    if ($residentId) {
                        $matchedAt = $importedAt;
                        $matchedCount++;
                    }
                }

                $insertData[] = [
                    'id' => \Illuminate\Support\Str::uuid()->toString(),
                    'barangay_id' => $barangayId,
                    'last_name' => $row['last_name'],
                    'first_name' => $row['first_name'],
                    'middle_name' => $row['middle_name'],
                    'full_name' => $row['full_name'],
                    'precinct_number' => $row['precinct_number'],
                    'address' => $row['address'],
                    'application_number' => $row['application_number'],
                    'resident_id' => $residentId,
                    'matched_at' => $matchedAt,
                    'imported_at' => $importedAt,
                    'created_at' => $importedAt,
                    'updated_at' => $importedAt,
                ];
            }

            DB::transaction(function () use ($barangayId, $insertData) {
                // Delete entire old batch for this barangay
                Voter::where('barangay_id', $barangayId)->delete();

                // Insert new batch in chunks
                foreach (array_chunk($insertData, 500) as $chunk) {
                    Voter::insert($chunk);
                }
            });

            Log::info('COMELEC import complete', [
                'barangay_id' => $barangayId,
                'total' => count($insertData),
                'matched' => $matchedCount,
            ]);

            return response()->json([
                'message' => 'Import successful.',
                'total' => count($insertData),
                'matched' => $matchedCount,
                'imported_at' => $importedAt->toISOString(),
            ]);
        } catch (\Throwable $e) {
            Storage::delete($path);
            Log::error('COMELEC import failed', ['error' => $e->getMessage()]);

            return response()->json(['message' => 'Import failed: '.$e->getMessage()], 500);
        }
    }

    // ── Match Suggestions ──────────────────────────────────────────────────

    public function suggestions(Request $request, string $id): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;
        $voter = Voter::where('barangay_id', $barangayId)->findOrFail($id);

        $lastName = trim($voter->last_name);
        $firstName = trim($voter->first_name);

        // Simple fuzzy/partial search on residents table within the same barangay
        $candidates = Resident::where('barangay_id', $barangayId)
            ->whereNull('deleted_at')
            ->where(function ($q) use ($lastName, $firstName) {
                $q->where('last_name', 'ilike', '%' . $lastName . '%')
                  ->orWhere('first_name', 'ilike', '%' . $firstName . '%');
            })
            ->limit(10)
            ->get(['id', 'first_name', 'last_name', 'middle_name', 'resident_number', 'purok', 'street', 'is_voter']);

        return response()->json($candidates);
    }

    // ── Link Voter to Resident ─────────────────────────────────────────────

    public function link(Request $request, string $id): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;
        $voter = Voter::where('barangay_id', $barangayId)->findOrFail($id);

        $validated = $request->validate([
            'resident_id' => ['required', 'uuid', 'exists:residents,id'],
        ]);

        $resident = Resident::where('barangay_id', $barangayId)
            ->whereNull('deleted_at')
            ->findOrFail($validated['resident_id']);

        DB::transaction(function () use ($voter, $resident) {
            // Update voter record
            $voter->update([
                'resident_id' => $resident->id,
                'matched_at' => now(),
            ]);

            // Update resident profile
            $resident->update([
                'is_voter' => true,
                'voter_precinct_number' => $voter->precinct_number,
            ]);
        });

        Log::info('Voter manually linked to resident', [
            'voter_id' => $voter->id,
            'resident_id' => $resident->id,
            'user_id' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Voter linked successfully.',
            'voter' => $voter->fresh('resident:id,first_name,last_name,resident_number'),
        ]);
    }

    // ── Unlink Voter from Resident ───────────────────────────────────────────

    public function unlink(Request $request, string $id): JsonResponse
    {
        $barangayId = $request->user()->barangay_id;
        $voter = Voter::where('barangay_id', $barangayId)->findOrFail($id);

        $residentId = $voter->resident_id;

        if ($residentId) {
            $resident = Resident::where('barangay_id', $barangayId)
                ->whereNull('deleted_at')
                ->find($residentId);

            DB::transaction(function () use ($voter, $resident) {
                // Clear voter link
                $voter->update([
                    'resident_id' => null,
                    'matched_at' => null,
                ]);

                // Clear resident voter status
                if ($resident) {
                    $resident->update([
                        'is_voter' => false,
                        'voter_precinct_number' => null,
                    ]);
                }
            });

            Log::info('Voter manually unlinked from resident', [
                'voter_id' => $voter->id,
                'resident_id' => $residentId,
                'user_id' => $request->user()->id,
            ]);
        }

        return response()->json([
            'message' => 'Voter unlinked successfully.',
            'voter' => $voter->fresh(),
        ]);
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private function buildResidentIndex(string $barangayId): array
    {
        $residents = Resident::where('barangay_id', $barangayId)
            ->whereNull('deleted_at')
            ->select(['id', 'first_name', 'last_name', 'middle_name'])
            ->get();

        $index = [];
        foreach ($residents as $r) {
            $key = $this->nameKey($r->last_name, $r->first_name);
            $index[$key][] = [
                'id' => $r->id,
                'middle_key' => $this->nameKey($r->last_name, $r->first_name, $r->middle_name),
            ];
        }

        return $index;
    }

    private function nameKey(string $lastName, string $firstName, ?string $middleName = null): string
    {
        $key = mb_strtolower(trim($lastName)).'|'.mb_strtolower(trim($firstName));
        if ($middleName) {
            $key .= '|'.mb_strtolower(trim($middleName));
        }

        return $key;
    }
}
