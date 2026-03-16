<?php

declare(strict_types=1);

use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;

/**
 * Unit tests for QR code generation.
 * Verifies that chillerlan/php-qrcode produces a real scannable SVG data URI,
 * not the old placeholder that just said "QR CODE" as text.
 */

test('QR code library generates a valid SVG data URI', function (): void {
    $options = new QROptions([
        'outputType'    => QRCode::OUTPUT_MARKUP_SVG,
        'eccLevel'      => QRCode::ECC_M,
        'addQuietzone'  => true,
        'quietzoneSize' => 4,
        'imageBase64'   => true,
    ]);

    $url     = 'https://verify.barangay.org.ph/abc123def456';
    $dataUri = (new QRCode($options))->render($url);

    // Must be a base64-encoded SVG data URI
    expect($dataUri)->toStartWith('data:image/svg+xml;base64,');

    // Decode and verify it is real SVG markup
    $svgContent = base64_decode(substr($dataUri, strlen('data:image/svg+xml;base64,')));
    expect($svgContent)->toContain('<svg');
    expect($svgContent)->toContain('</svg>');

    // Must NOT be the old placeholder (which only contained "QR CODE" text, not actual paths)
    expect($svgContent)->not->toContain('QR CODE');
    expect($svgContent)->not->toContain('QR UNAVAILABLE');

    // A real QR code SVG uses <path elements for the modules/cells (not the placeholder text)
    $pathCount = substr_count($svgContent, '<path');
    expect($pathCount)->toBeGreaterThan(5); // Real QR code SVG has multiple path elements

    // chillerlan/php-qrcode adds class="qr-svg" marker on the root element
    expect($svgContent)->toContain('qr-svg');
});

test('QR code encodes different URLs into different outputs', function (): void {
    $options = new QROptions([
        'outputType'   => QRCode::OUTPUT_MARKUP_SVG,
        'eccLevel'     => QRCode::ECC_M,
        'imageBase64'  => true,
    ]);

    $qr = new QRCode($options);

    $uri1 = $qr->render('https://verify.barangay.org.ph/aabbcc112233');
    $uri2 = $qr->render('https://verify.barangay.org.ph/xxyyzz998877');

    expect($uri1)->not->toBe($uri2);
});
