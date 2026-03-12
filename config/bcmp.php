<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Credit Pricing Configuration
    |--------------------------------------------------------------------------
    |
    | Standard credit costs applied across all barangays.
    | Set via admin dashboard (founder.primex.ventures > BCMP > Subscriptions).
    | Values here are defaults; admin can override via PlatformSettings.
    |
    */

    'sms' => [
        // Cost per SMS segment in PHP pesos
        'cost_per_segment' => (float) env('BCMP_SMS_COST_PER_SEGMENT', 0.50),

        // Characters per SMS segment (GSM standard: 160, but we use 159 for safety)
        'chars_per_segment' => (int) env('BCMP_SMS_CHARS_PER_SEGMENT', 159),

        // Monthly sender name reservation fee per barangay (auto-charged on 1st)
        'monthly_sender_fee' => (float) env('BCMP_SMS_MONTHLY_SENDER_FEE', 300.00),
    ],

    'map' => [
        // Cost per new resident pin on map
        'cost_per_new_pin' => (float) env('BCMP_MAP_COST_PER_NEW_PIN', 1.00),

        // Cost per resident pin edit (location update)
        'cost_per_edit_pin' => (float) env('BCMP_MAP_COST_PER_EDIT_PIN', 1.00),
    ],

    'ai' => [
        // Markup percentage on top of Claude's raw cost (Jeager's profit margin)
        // This is the global default; per-barangay override via barangay settings
        'markup_percentage' => (float) env('AI_MARKUP_PERCENTAGE', 60.00),
    ],

    'call' => [
        // Call credits -- on hold, pricing TBD
        'cost_per_minute' => (float) env('BCMP_CALL_COST_PER_MINUTE', 0.00),
    ],

];
