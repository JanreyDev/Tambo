<?php

declare(strict_types=1);

namespace App\Enums;

enum CivilStatus: string
{
    case Single = 'single';
    case Married = 'married';
    case Widowed = 'widowed';
    case Separated = 'separated';
    case Divorced = 'divorced';
    case Annulled = 'annulled';
}
