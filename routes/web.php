<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Health check endpoint — used by CI/CD verified deployment (pre-swap + post-swap smoke tests)
Route::get('/up', function () {
    return response('OK', 200);
});

// Catch-all: any browser-accessible URL that doesn't match a defined route
// redirects to the status page. Prevents directory enumeration and information
// leakage from Laravel's default 404 page on web routes.
Route::fallback(function () {
    return redirect('/');
});
