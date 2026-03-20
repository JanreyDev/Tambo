<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Health check endpoint — used by CI/CD verified deployment (pre-swap + post-swap smoke tests)
Route::get('/up', function () {
    return response('OK', 200);
});

// Catch-all: redirect any unknown web route to the status page.
Route::fallback(function () {
    return redirect('/');
});
