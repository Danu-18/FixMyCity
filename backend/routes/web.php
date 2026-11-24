<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return view('welcome');
});

// Storage fallback route for serving uploaded complaint images and assets with CORS
Route::get('/storage/{path}', function (string $path) {
    if (Storage::disk('public')->exists($path)) {
        $response = Storage::disk('public')->response($path);
        $response->headers->set('Access-Control-Allow-Origin', '*');
        $response->headers->set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        return $response;
    }
    abort(404, 'File not found');
})->where('path', '.*');
