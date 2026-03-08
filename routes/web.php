<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Catch-all: redirect any unknown web route to the status page.
Route::fallback(function () {
    return redirect('/');
});
