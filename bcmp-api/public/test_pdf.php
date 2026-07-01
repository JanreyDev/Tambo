<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';

// Boot Laravel kernel
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Tenant\Documents\IssuedDocument;
use App\Models\Admin\Barangay;
use App\Models\Tenant\Documents\DocumentTemplate;
use App\Models\Tenant\Resident;
use App\Services\DocumentPdfService;

// Find the last issued document with a resident
$doc = IssuedDocument::where('constituent_type', 'resident')->latest()->first();
if (!$doc) {
    echo "No issued documents found.\n";
    exit;
}

$barangay = Barangay::find($doc->barangay_id);
$template = DocumentTemplate::find($doc->template_id);
$resident = Resident::with(['photoFile', 'sectoralTags'])->find($doc->constituent_id);

echo "Generating PDF for Document: " . $doc->document_number . " (Barangay: " . $barangay->name . ")\n";

$pdfService = app(DocumentPdfService::class);
$pdfBinary = $pdfService->generate($doc, $template, $barangay, $resident, null, null, null);

file_put_contents(__DIR__ . '/test.pdf', $pdfBinary);
echo "PDF generated successfully! Size: " . strlen($pdfBinary) . " bytes\n";

// Count pages in generated PDF
// In DomPDF generated PDFs, pages are defined in the /Kids array of the Pages dictionary, or we can check the count of '/Type /Page'
$pages = preg_match_all('/\/Type\s*\/Page\b/', $pdfBinary, $matches);
echo "Estimated page count: " . $pages . "\n";
