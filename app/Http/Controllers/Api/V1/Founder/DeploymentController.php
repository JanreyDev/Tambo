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
                            $allPipelines[] = [
                                'id' => $pipeline['id'],
                                'project_id' => $project['id'],
                                'project_name' => $project['name'],
                                'project_path' => $project['path_with_namespace'],
                                'ref' => $pipeline['ref'],
                                'status' => $pipeline['status'],
                                'source' => $pipeline['source'] ?? null,
                                'created_at' => $pipeline['created_at'],
                                'updated_at' => $pipeline['updated_at'],
                                'web_url' => $pipeline['web_url'],
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
                'data' => [
                    'pipelines' => $allPipelines,
                    'project_count' => count($projects),
                ],
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
}
