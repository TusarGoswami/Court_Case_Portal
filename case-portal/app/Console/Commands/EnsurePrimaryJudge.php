<?php

namespace App\Console\Commands;

use App\Models\CourtCase;
use App\Models\Judge;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class EnsurePrimaryJudge extends Command
{
    protected $signature = 'ecourt:ensure-primary-judge
                            {--reassign-docket : Point all court cases at the primary bench judge}
                            {--password= : Override PRIMARY_JUDGE_PASSWORD from .env for this run only}';

    protected $description = 'Create/update Justice Sunderlal Tripathi roster + judge login and optionally reassign all matters to this bench';

    public function handle(): int
    {
        $email = strtolower((string) config('ecourt.primary_judge_email'));
        $password = $this->option('password') ?: config('ecourt.primary_judge_password');

        if (!$password) {
            $this->error('Set PRIMARY_JUDGE_PASSWORD in .env or pass --password=');

            return self::FAILURE;
        }

        $user = User::where('email', $email)->first();
        if (!$user) {
            $user = User::create([
                'name' => 'Justice Sunderlal Tripathi',
                'email' => $email,
                'password' => Hash::make($password),
                'role' => 'judge',
                'phone' => '+91-9876543210',
                'is_active' => true,
                'photo_url' => '/images/Justice_Sunderlal_Tripathi.png',
            ]);
            $this->info("Created judge user {$email}");
        } else {
            $user->update([
                'name' => 'Justice Sunderlal Tripathi',
                'role' => 'judge',
                'password' => Hash::make($password),
                'photo_url' => '/images/Justice_Sunderlal_Tripathi.png',
            ]);
            $this->info("Updated judge user {$email}");
        }

        $jurisdictions = ['Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'National High Court of India'];
        $caseTypes = ['Civil', 'Criminal'];

        $profile = [
            'position' => 'Senior High Court Judge',
            'court' => 'National High Court of India',
            'specialization' => ['Criminal Law', 'Constitutional Matters', 'Public Interest Litigation'],
            'experience_label' => '28+ Years',
            'roster_status' => 'Active',
            'about' => 'Justice Sunderlal Tripathi is a highly respected and disciplined judge known for his integrity, sharp legal reasoning, and commitment to justice. With decades of experience in the Indian judiciary system, he has presided over several high-profile criminal and constitutional cases.

Recognized for maintaining strict courtroom discipline and delivering unbiased judgments, Justice Tripathi believes in ensuring equal justice for every citizen regardless of social or political influence.',
            'professional_highlights' => [
                'Handled 2,500+ legal cases',
                'Expertise in criminal and constitutional law',
                'Known for fast-track hearing management',
                'Strong supporter of digital judiciary systems',
                'Recognized for transparent judicial decisions',
                'Excellent courtroom leadership and legal analysis',
            ],
            'key_responsibilities' => [
                'Reviewing active legal cases',
                'Scheduling and conducting hearings',
                'Verifying evidence and legal documentation',
                'Managing courtroom proceedings',
                'Issuing final judgments and orders',
                'Supervising legal compliance and ethics',
            ],
            'judicial_philosophy' => 'Justice must remain fearless, transparent, and accessible to every citizen.',
            'skills' => [
                'Legal Interpretation',
                'Evidence Analysis',
                'Courtroom Management',
                'Conflict Resolution',
                'Judicial Ethics',
                'Decision Making',
                'Case Prioritization',
            ],
            'achievements' => [
                'Awarded “Excellence in Judicial Service”',
                'Successfully resolved several sensitive public cases',
                'Contributed to modernization of digital court systems',
                'Highly rated for fairness and judicial conduct',
            ],
            'availability_summary' => 'Monday to Friday · 10:00 AM – 5:00 PM',
            'virtual_hearings_supported' => true,
            'court_contact_email' => 'judge.tripathi@court.gov',
            'chamber' => 'Hall 4, High Court Division',
            'office_extension' => '+91-XXXX-XXXXXX',
        ];

        Judge::query()->update(['is_primary_bench' => false]);

        $judge = Judge::updateOrCreate(
            ['login_email' => $email],
            array_merge([
                'name' => 'Justice Sunderlal Tripathi',
                'user_id' => (string) $user->id,
                'photo_url' => '/images/Justice_Sunderlal_Tripathi.png',
                'jurisdictions' => $jurisdictions,
                'case_types' => $caseTypes,
                'is_available' => true,
                'is_primary_bench' => true,
            ], $profile)
        );

        $this->info('Primary bench judge roster saved (ID '.$judge->id.').');

        if ($this->option('reassign-docket')) {
            $n = 0;
            foreach (CourtCase::query()->cursor() as $matter) {
                $matter->update([
                    'judge_id' => (string) $judge->id,
                    'judge_user_id' => (string) $user->id,
                ]);
                $n++;
            }
            $this->info("Reassigned {$n} court matters to primary bench.");
        }

        $this->writePortraitIfMissing();

        return self::SUCCESS;
    }

    /**
     * Writes a tiny placeholder PNG only if the file is missing (replace with your portrait in public/images).
     */
    private function writePortraitIfMissing(): void
    {
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');
        $filename = 'Justice_Sunderlal_Tripathi.png';
        $roots = [
            dirname(base_path()).DIRECTORY_SEPARATOR.'case-frontend'.DIRECTORY_SEPARATOR.'public'.DIRECTORY_SEPARATOR.'images',
            public_path('images'),
        ];
        foreach ($roots as $dir) {
            if (! is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
            $path = $dir.DIRECTORY_SEPARATOR.$filename;
            if (! file_exists($path)) {
                file_put_contents($path, $png);
                $this->line("Wrote placeholder portrait (replace with your image): {$path}");
            }
        }
    }
}
