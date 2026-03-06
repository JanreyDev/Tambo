<?php

declare(strict_types=1);

namespace App\Enums;

enum ResidentStatus: string
{
    case Active = 'active';
    case Deceased = 'deceased';
    case Transferred = 'transferred';
    case Archived = 'archived';
}
