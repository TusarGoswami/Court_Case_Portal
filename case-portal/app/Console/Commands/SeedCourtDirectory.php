<?php

namespace App\Console\Commands;

use App\Models\Judge;
use App\Models\Lawyer;
use Illuminate\Console\Command;

class SeedCourtDirectory extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:seed-court-directory {--force : Seed even if data exists}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed sample lawyers and judges for development';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $force = (bool) $this->option('force');

        if (!$force && (Lawyer::count() > 0 || Judge::count() > 0)) {
            $this->info('Lawyers/Judges already exist. Use --force to reseed.');
            return self::SUCCESS;
        }

        if ($force) {
            Lawyer::query()->delete();
            Judge::query()->delete();
        }

        $jurisdictions = ['Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad'];
        $categories = ['Cyber Crime', 'Fraud', 'Harassment', 'Property', 'Family', 'Contract'];

        $lawyers = [
            [
                'name' => 'Adv. Riya Sharma',
                'photo_url' => 'https://i.pravatar.cc/150?img=47',
                'specializations' => ['Cyber Law', 'Criminal Defense'],
                'experience_years' => 7,
                'cases_won' => 83,
                'rating' => 4.6,
                'description' => 'LLB, expertise in cyber crime and digital evidence handling.',
                'categories' => ['Cyber Crime', 'Harassment'],
                'jurisdictions' => ['Delhi', 'Bengaluru'],
                'is_available' => true,
            ],
            [
                'name' => 'Adv. Amit Verma',
                'photo_url' => 'https://i.pravatar.cc/150?img=12',
                'specializations' => ['Civil Litigation', 'Property'],
                'experience_years' => 12,
                'cases_won' => 140,
                'rating' => 4.8,
                'description' => 'LLM, property and civil dispute resolution specialist.',
                'categories' => ['Property', 'Contract'],
                'jurisdictions' => ['Mumbai', 'Hyderabad'],
                'is_available' => true,
            ],
            [
                'name' => 'Adv. Neha Gupta',
                'photo_url' => 'https://i.pravatar.cc/150?img=32',
                'specializations' => ['Family Law', 'Mediation'],
                'experience_years' => 9,
                'cases_won' => 96,
                'rating' => 4.5,
                'description' => 'Family law advocate focused on mediation and settlements.',
                'categories' => ['Family', 'Harassment'],
                'jurisdictions' => ['Delhi', 'Mumbai'],
                'is_available' => true,
            ],
        ];

        foreach ($lawyers as $lawyer) {
            Lawyer::create($lawyer);
        }

        $judges = [
            [
                'name' => 'Hon. Judge S. Mehra',
                'photo_url' => 'https://i.pravatar.cc/150?img=5',
                'jurisdictions' => ['Delhi'],
                'case_types' => ['Civil', 'Criminal'],
                'is_available' => true,
                'active_cases_count' => 3,
            ],
            [
                'name' => 'Hon. Judge P. Iyer',
                'photo_url' => 'https://i.pravatar.cc/150?img=8',
                'jurisdictions' => ['Mumbai'],
                'case_types' => ['Civil'],
                'is_available' => true,
                'active_cases_count' => 1,
            ],
            [
                'name' => 'Hon. Judge A. Rao',
                'photo_url' => 'https://i.pravatar.cc/150?img=9',
                'jurisdictions' => ['Bengaluru', 'Hyderabad'],
                'case_types' => ['Criminal'],
                'is_available' => true,
                'active_cases_count' => 2,
            ],
        ];

        foreach ($judges as $judge) {
            Judge::create($judge);
        }

        $this->info('Seeded lawyers and judges successfully.');
        return self::SUCCESS;
    }
}
