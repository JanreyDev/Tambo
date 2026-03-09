<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Founder;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DeploymentController extends Controller
{
    /**
     * Get recent GitLab CI/CD pipeline runs across all projects in the PrimeX Claude group.
     */
    public function recent(): JsonResponse
    {
        $token = config('services.gitlab.token');
        $groupId = config('services.gitlab.group_id');

        if ($token === null || $token === '' || $groupId === null || $groupId === '') {
            return response()->json([
                'message' => 'GitLab not configured.',
                'data' => [],
            ]);
        }

        try {
            // Get projects in the group.
            $projectsResponse = Http::timeout(10)
                ->withToken($token)
                ->get("https://gitlab.com/api/v4/groups/{$groupId}/projects", [
                    'per_page' => 50,
                    'include_subgroups' => true,
                ]);

            if ($projectsResponse->failed()) {
                Log::error('GitLab API: failed to fetch projects', [
                    'status' => $projectsResponse->status(),
                    'body' => $projectsResponse->body(),
                ]);

                return response()->json([
                    'message' => "GitLab API error: HTTP {$projectsResponse->status()}",
                    'data' => [],
                ], 502);
            }

            $projects = $projectsResponse->json();
            $allPipelines = [];

            // Fetch recent pipelines for each project.
            foreach ($projects as $project) {
                try {
                    $pipelinesResponse = Http::timeout(5)
                        ->withToken($token)
                        ->get("https://gitlab.com/api/v4/projects/{$project['id']}/pipelines", [
                            'per_page' => 5,
                            'order_by' => 'updated_at',
                            'sort' => 'desc',
                        ]);

                    if ($pipelinesResponse->successful()) {
                        foreach ($pipelinesResponse->json() as $pipeline) {
                            $durationSeconds = null;
                            if (! empty($pipeline['created_at']) && ! empty($pipeline['updated_at'])) {
                                try {
                                    $start = \Carbon\Carbon::parse($pipeline['created_at']);
                                    $end = \Carbon\Carbon::parse($pipeline['updated_at']);
                                    $durationSeconds = (int) $start->diffInSeconds($end);
                                } catch (\Exception) {
                                    // Ignore parse errors.
                                }
                            }

                            $allPipelines[] = [
                                'id' => (string) $pipeline['id'],
                                'project_name' => $project['name'],
                                'branch' => $pipeline['ref'] ?? 'main',
                                'status' => $this->mapPipelineStatus($pipeline['status'] ?? 'unknown'),
                                'commit_message' => $pipeline['ref'] ?? 'Pipeline run',
                                'triggered_by' => $pipeline['source'] ?? 'push',
                                'created_at' => $pipeline['created_at'],
                                'duration_seconds' => $durationSeconds,
                                'web_url' => $pipeline['web_url'] ?? null,
                            ];
                        }
                    }
                } catch (\Exception $e) {
                    Log::warning('GitLab API: failed to fetch pipelines for project', [
                        'project_id' => $project['id'],
                        'project_name' => $project['name'],
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            // Sort all pipelines by updated_at descending.
            usort($allPipelines, fn (array $a, array $b) => strcmp($b['updated_at'], $a['updated_at']));

            // Return the 20 most recent.
            $allPipelines = array_slice($allPipelines, 0, 20);

            return response()->json([
                'data' => $allPipelines,
            ]);
        } catch (\Exception $e) {
            Log::error('GitLab API: deployment fetch exception', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to fetch deployment data.',
                'data' => [],
            ], 502);
        }
    }

    /**
     * Map GitLab pipeline status to frontend Deployment status.
     */
    private function mapPipelineStatus(string $status): string
    {
        return match ($status) {
            'success' => 'success',
            'failed' => 'failed',
            'running' => 'running',
            'pending', 'waiting_for_resource', 'preparing', 'created' => 'pending',
            'canceled', 'skipped', 'manual', 'scheduled' => 'failed',
            default => 'pending',
        };
    }
}
