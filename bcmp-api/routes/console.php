<?php

use Illuminate\Support\Facades\Schedule;

// Monthly SMS sender name reservation fee (₱300/barangay on 1st of each month at 1:00 AM PHT)
Schedule::command('bcmp:charge-sms-sender-fee')->monthlyOn(1, '01:00')->timezone('Asia/Manila');
