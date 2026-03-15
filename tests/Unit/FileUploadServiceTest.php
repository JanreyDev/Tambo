<?php

declare(strict_types=1);

use App\Services\FileUploadService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(Tests\TestCase::class, RefreshDatabase::class);

/**
 * Unit tests for FileUploadService image compression.
 *
 * Tests the maybeCompress logic via the upload path using a fake disk.
 * No real storage or DB required — uses Laravel's fake storage.
 */
describe('FileUploadService image compression', function () {

    beforeEach(function () {
        Storage::fake('public');
        config(['filesystems.default' => 'local']); // local → 'public' disk in service
    });

    it('compresses an oversized JPEG photo to JPEG under limits', function () {
        // Create a 2000×2500 fake JPEG using GD (well above the 800×1000 limit)
        $img = imagecreatetruecolor(2000, 2500);
        $red = imagecolorallocate($img, 200, 50, 50);
        imagefilledrectangle($img, 0, 0, 2000, 2500, $red);
        ob_start();
        imagejpeg($img, null, 95);
        $jpeg = ob_get_clean();
        imagedestroy($img);

        $file = UploadedFile::fake()->createWithContent('photo.jpg', $jpeg);

        $service = app(FileUploadService::class);
        $record  = $service->upload(
            file: $file,
            category: 'photo',
            path: 'bcmp/test/photos',
            isPublic: true,
        );

        // Must be stored as JPEG
        expect($record->mime_type)->toBe('image/jpeg');
        expect($record->stored_name)->toEndWith('.jpg');

        // Stored dimensions must not exceed 800×1000
        [$w, $h] = $record->metadata['stored_dimensions'];
        expect($w)->toBeLessThanOrEqual(800);
        expect($h)->toBeLessThanOrEqual(1000);

        // Must have recorded compression metadata
        expect($record->metadata)->toHaveKey('original_dimensions');
        expect($record->metadata)->toHaveKey('savings_pct');
        expect($record->metadata['was_compressed'] ?? true)->toBeTruthy();
    });

    it('does not upscale a small photo', function () {
        // Create a 200×250 JPEG — already within limits
        $img = imagecreatetruecolor(200, 250);
        ob_start();
        imagejpeg($img, null, 90);
        $jpeg = ob_get_clean();
        imagedestroy($img);

        $file = UploadedFile::fake()->createWithContent('small.jpg', $jpeg);

        $service = app(FileUploadService::class);
        $record  = $service->upload(
            file: $file,
            category: 'photo',
            path: 'bcmp/test/photos',
        );

        [$w, $h] = $record->metadata['stored_dimensions'];
        expect($w)->toBe(200);
        expect($h)->toBe(250);
    });

    it('converts photo PNG to JPEG', function () {
        // PNGs are often larger than JPEGs — server converts them
        $img = imagecreatetruecolor(400, 500);
        ob_start();
        imagepng($img);
        $png = ob_get_clean();
        imagedestroy($img);

        $file = UploadedFile::fake()->createWithContent('photo.png', $png);

        $service = app(FileUploadService::class);
        $record  = $service->upload(
            file: $file,
            category: 'photo',
            path: 'bcmp/test/photos',
        );

        // Photo PNG must be converted to JPEG
        expect($record->mime_type)->toBe('image/jpeg');
        expect($record->stored_name)->toEndWith('.jpg');
    });

    it('keeps logo as PNG to preserve transparency', function () {
        // Logo with alpha channel
        $img = imagecreatetruecolor(300, 300);
        imagealphablending($img, false);
        imagesavealpha($img, true);
        ob_start();
        imagepng($img);
        $png = ob_get_clean();
        imagedestroy($img);

        $file = UploadedFile::fake()->createWithContent('logo.png', $png);

        $service = app(FileUploadService::class);
        $record  = $service->upload(
            file: $file,
            category: 'logo',
            path: 'bcmp/test/logos',
            isPublic: true,
        );

        expect($record->mime_type)->toBe('image/png');
        expect($record->stored_name)->toEndWith('.png');
    });

    it('stores documents without compression', function () {
        $file = UploadedFile::fake()->create('doc.pdf', 500, 'application/pdf');

        $service = app(FileUploadService::class);
        $record  = $service->upload(
            file: $file,
            category: 'document',
            path: 'bcmp/test/docs',
        );

        // No compression metadata for documents
        expect($record->metadata)->not->toHaveKey('stored_dimensions');
        expect($record->mime_type)->toBe('application/pdf');
    });

    it('falls back to raw content if GD fails to parse', function () {
        // Send garbage bytes that imagecreatefromstring will reject
        $file = UploadedFile::fake()->createWithContent('bad.jpg', 'not-an-image');

        $service = app(FileUploadService::class);
        $record  = $service->upload(
            file: $file,
            category: 'photo',
            path: 'bcmp/test/photos',
        );

        // Falls back to passthrough — extension stays as-is
        expect($record->metadata['was_compressed'] ?? false)->toBeFalsy();
    });
});
