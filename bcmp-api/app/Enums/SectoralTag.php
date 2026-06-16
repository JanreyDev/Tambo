<?php

declare(strict_types=1);

namespace App\Enums;

enum SectoralTag: string
{
    case SoloParent = 'solo_parent';
    case Ofw = 'ofw';
    case Pwd = 'pwd';
    case Osc = 'osc';           // Out of School Children
    case Osy = 'osy';           // Out of School Youth
    case Unemployed = 'unemployed';
    case LaborForce = 'labor_force';
    case Isy = 'isy';           // In-School Youth
    case FourPs = '4ps';        // Pantawid Pamilyang Pilipino Program
    case SeniorCitizen = 'senior_citizen';
    case Ip = 'ip';             // Indigenous People

    public function label(): string
    {
        return match ($this) {
            self::SoloParent => 'Solo Parent',
            self::Ofw => 'OFW',
            self::Pwd => 'PWD',
            self::Osc => 'Out of School Children',
            self::Osy => 'Out of School Youth',
            self::Unemployed => 'Unemployed',
            self::LaborForce => 'Labor Force',
            self::Isy => 'In-School Youth',
            self::FourPs => '4Ps',
            self::SeniorCitizen => 'Senior Citizen',
            self::Ip => 'Indigenous People',
        };
    }
}
