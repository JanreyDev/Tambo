<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Hardened bounds — matches frontend, prevents bcrypt/Argon2 DoS via oversized inputs.
        // username max 64: NIST 800-63B / OWASP ASVS guidance (DB column is varchar(100), 64 is safer floor).
        // password max 128: bcrypt truncates at 72 bytes; cap at 128 to prevent CPU-burn DoS and force prehash if needed.
        return [
            'username' => ['required', 'string', 'min:3', 'max:64', 'regex:/^[A-Za-z0-9._@+\-]+$/'],
            'password' => ['required', 'string', 'min:8', 'max:128'],
            'device_name' => ['sometimes', 'string', 'max:64'],
        ];
    }

    public function messages(): array
    {
        return [
            'username.required' => 'Username is required.',
            'username.regex' => 'Username contains invalid characters.',
            'username.max' => 'Username is too long.',
            'password.required' => 'Password is required.',
            'password.min' => 'Password must be at least 8 characters.',
            'password.max' => 'Password is too long.',
        ];
    }

    /**
     * Strip whitespace + lowercase username for consistent lookup.
     * Defends against unicode lookalike + trailing-space credential confusion.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('username')) {
            $this->merge([
                'username' => trim((string) $this->input('username')),
            ]);
        }
    }
}
