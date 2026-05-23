<?php

namespace Database\Seeders;

use App\Models\BlogPost;
use Illuminate\Database\Seeder;

class BlogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Truncate existing blog posts to clean up feed
        BlogPost::truncate();

        $posts = [
            [
                'author_id' => '000000000000000000000001',
                'author_name' => 'Justice K. Chandru (Retd.)',
                'author_role' => 'judge',
                'author_photo' => '',
                'title' => 'The Right to be Forgotten: Digital Sovereignty in the Algorithmic Age',
                'slug' => BlogPost::generateSlug('The Right to be Forgotten: Digital Sovereignty in the Algorithmic Age'),
                'excerpt' => 'An editorial exploring the intersection of constitutional privacy rights and modern algorithmic tracking in Indian courts under the landmark K.S. Puttaswamy judgment.',
                'body' => "In the digital age, our past behaves less like a shadow and more like a permanent tattoo. Under the landmark K.S. Puttaswamy v. Union of India decision, the Supreme Court declared privacy to be a fundamental right under Article 21. Yet, the practical implementation of one of its most nuanced corollaries—the 'Right to be Forgotten' (RTBF)—remains a contested battlefield in Indian jurisprudence.\n\nHistorically, legal archives were public and accessible only through physical search of court record rooms. Today, judicial databases and search engines index every judgment, exposing sensitive personal histories, past disputes, and long-resolved allegations to the public gaze with a single search query. This digital permanence often acts as a perpetual punishment, hindering individuals from moving forward in their personal and professional lives.\n\n### The Judicial Conflict\nVarious High Courts have approached this dilemma with differing philosophies. The Delhi and Gujarat High Courts have, in specific instances of matrimonial disputes and long-resolved criminal acquittals, directed search engines to de-index judgments to protect the petitioners' reputation. Conversely, other benches have emphasized the principle of open courts and the public's right to know, arguing that removing official judicial records undermines transparency and history.\n\n### Finding the Equilibrium\nAs India transitions towards the Digital Personal Data Protection (DPDP) Act, the legal architecture must codify a structured framework for RTBF. De-indexing does not mean erasing public records or history; it simply prevents search engines from surfacing sensitive personal data in generic search results. The judiciary must establish clear guidelines defining the threshold for de-indexing, balancing individual dignity and rehabilitation against the public interest of transparent archiving.",
                'category' => 'Constitutional',
                'cover_image_url' => '/storage/blog_covers/digital_privacy_editorial.png',
                'tags' => ['privacy', 'digital-rights', 'constitutional', 'puttaswamy'],
                'is_featured' => true,
                'is_published' => true,
                'views' => 1240,
                'reading_time_min' => 5,
            ],
            [
                'author_id' => '000000000000000000000002',
                'author_name' => 'Dr. Pavan Duggal',
                'author_role' => 'lawyer',
                'author_photo' => '',
                'title' => 'Securing the Bench: Rising Ransomware Threats in Judicial Networks',
                'slug' => BlogPost::generateSlug('Securing the Bench: Rising Ransomware Threats in Judicial Networks'),
                'excerpt' => 'A critical analysis of the cybersecurity vulnerabilities facing e-court infrastructure and the required legal protocols to protect national critical information assets.',
                'body' => "As judiciaries worldwide migrate online to facilitate speedy trials and remote hearings, they have inadvertently emerged as prime targets for sophisticated cyber warfare. The digitalization of the justice system—from e-filing portals to digital evidence databases—has created a vast attack surface for ransomware cartels seeking to disrupt public services and hold sensitive litigation data hostage.\n\nIn recent years, security breaches in high court databases and municipal court management systems have demonstrated that judicial networks are no longer immune to external threats. A successful ransomware attack does not merely encrypt files; it halts the wheels of justice, compromises client-attorney privilege, and leaks sensitive state documents, causing irreversible damage to institutional trust.\n\n### Vulnerabilities in e-Courts\nThe primary entry points for these attacks are outdated software dependencies, insecure remote access configurations, and human error (phishing). Additionally, the decentralization of court servers across various districts makes uniform security patch management a significant operational challenge. When a single local court node is compromised, it can act as a bridgehead for attackers to traverse horizontally across the entire state judicial intranet.\n\n### Legal and Technical Defenses\nUnder the Information Technology Act, 2000, and subsequent guidelines, court infrastructures must be classified as 'Critical Information Infrastructure' (CII). This classification mandates the enforcement of strict security architectures, including:\n1. Zero Trust Architecture (ZTA) and continuous network segmentation.\n2. Implementation of secure, air-gapped backup systems for judicial archives.\n3. Mandatory cybersecurity training and threat simulation drills for judicial officers and administrative staff.\n\nSecuring the bench is not merely an IT concern; it is a fundamental prerequisite for maintaining the integrity and independence of the rule of law in a digitized world.",
                'category' => 'Cyber Crime',
                'cover_image_url' => '/storage/blog_covers/cybersec_courts_editorial.png',
                'tags' => ['cybersecurity', 'cybersec', 'e-courts', 'ransomware'],
                'is_featured' => false,
                'is_published' => true,
                'views' => 850,
                'reading_time_min' => 6,
            ],
            [
                'author_id' => '000000000000000000000003',
                'author_name' => 'Senior Advocate Meenakshi Arora',
                'author_role' => 'lawyer',
                'author_photo' => '',
                'title' => 'Algorithmic Pricing and Consumer Fraud: Navigating E-Commerce Exploitation',
                'slug' => BlogPost::generateSlug('Algorithmic Pricing and Consumer Fraud: Navigating E-Commerce Exploitation'),
                'excerpt' => 'Examining dark patterns, automated surge pricing, and the legal remedies available to online shoppers under the Consumer Protection Act, 2019.',
                'body' => "The modern marketplace has moved from brick-and-mortar storefronts to fluid, algorithmic online platforms. While e-commerce offers unparalleled convenience, it has also introduced a subtle form of digital exploitation: dynamic algorithmic pricing and 'dark patterns' designed to manipulate consumer behavior.\n\nDynamic pricing algorithms continuously analyze consumer profile data, browsing history, and real-time demand to adjust prices dynamically. For instance, a user looking for emergency flight tickets or essential goods may be shown inflated prices based on their device type or location. Furthermore, platforms employ dark patterns—such as countdown timers ('only 2 seats left!') or hidden transaction fees added at the final checkout stage—to induce panic buying.\n\n### The Legal Framework\nThe Consumer Protection Act, 2019, provides robust tools to combat these unfair trade practices. Section 2(47) of the Act defines 'unfair trade practice' broadly enough to cover misleading claims, deceptive pricing, and the use of software features that manipulate consumer choices. The Central Consumer Protection Authority (CCPA) recently issued guidelines explicitly banning specific dark patterns, including 'coercive billing' and 'forced action'.\n\n### Empowering the Digital Consumer\nTo protect digital consumers, regulatory bodies must mandate algorithmic transparency. E-commerce platforms should be legally obligated to disclose the parameters governing dynamic pricing and declare when user data is utilized to personalize prices. Consumers must also leverage online grievance channels, such as the National Consumer Helpline (NCH), to report instances of price manipulation, ensuring that algorithmic automation does not bypass the law.",
                'category' => 'Rights & Duties',
                'cover_image_url' => '/storage/blog_covers/ecommerce_consumer_editorial.png',
                'tags' => ['consumer-rights', 'e-commerce', 'fraud', 'unfair-trade'],
                'is_featured' => false,
                'is_published' => true,
                'views' => 980,
                'reading_time_min' => 4,
            ],
            [
                'author_id' => '000000000000000000000004',
                'author_name' => 'Senior Counsel Harish Salve',
                'author_role' => 'lawyer',
                'author_photo' => '',
                'title' => 'Robo-Lawyers & Predictors: The Ethical Dilemma of AI in Modern Litigation',
                'slug' => BlogPost::generateSlug('Robo-Lawyers & Predictors: The Ethical Dilemma of AI in Modern Litigation'),
                'excerpt' => 'Exploring how predictive analytics and LLMs are transforming legal research while creating complex challenges for client-attorney privilege and judicial bias.',
                'body' => "The integration of Artificial Intelligence (AI) into the legal profession is no longer a futuristic speculation; it is an active reality. Advanced Large Language Models (LLMs) and predictive analytics are assisting law firms in drafting contracts, reviewing massive discovery documents, and predicting case outcomes based on historic judgments. However, as the legal profession embraces digital efficiency, it must confront severe ethical dilemmas.\n\n### The Automation of Research vs. Client Privilege\nWhen lawyers upload case briefs, sensitive client files, and confidential trade secrets into external generative AI platforms to draft legal arguments, they risk violating the fundamental duty of client confidentiality. Under Section 126 of the Indian Evidence Act, client-attorney communications are privileged. Sharing client information with proprietary third-party AI models without explicit consent and secure local hosting models compromises this privilege.\n\n### The Threat of Algorithmic Bias in Sentencing\nEven more concerning is the use of predictive AI systems by judiciaries to assess recidivism rates or determine bail conditions. AI algorithms are trained on historical judicial datasets, which may contain systemic biases. If the training data reflects past inequalities or biases, the AI will inevitably replicate and validate those biases under the guise of objective mathematical prediction.\n\n### Maintaining human agency\nThe law is not merely a logical calculation; it is a system of justice that requires human empathy, moral reasoning, and contextual understanding. While AI can serve as a powerful tool to expedite routine legal research and administration, the final evaluation of evidence, legal strategy, and judgment must remain an exclusively human endeavor to ensure the preservation of justice.",
                'category' => 'Legal Tech',
                'cover_image_url' => '/storage/blog_covers/ai_legaltech_editorial.png',
                'tags' => ['legal-tech', 'AI', 'ethics', 'predictive-justice'],
                'is_featured' => false,
                'is_published' => true,
                'views' => 1560,
                'reading_time_min' => 7,
            ],
            [
                'author_id' => '000000000000000000000005',
                'author_name' => 'Prof. (Dr.) Ranbir Singh',
                'author_role' => 'admin',
                'author_photo' => '',
                'title' => 'De-codifying the Archives: Procedural Gaps in the New Criminal Codes',
                'slug' => BlogPost::generateSlug('De-codifying the Archives: Procedural Gaps in the New Criminal Codes'),
                'excerpt' => 'An academic analysis of the operational challenges, procedural gaps, and judicial preparation required for transitioning to the new criminal law codes.',
                'body' => "The transition from the colonial-era Indian Penal Code (IPC), Code of Criminal Procedure (CrPC), and Indian Evidence Act to the Bharatiya Nyaya Sanhita (BNS), Bharatiya Nagarik Suraksha Sanhita (BNSS), and Bharatiya Sakshya Adhiniyam (BSA) marks the most significant criminal law overhaul in modern history. While the reforms aim to modernize legal terms and expedite trials, the practical implementation has revealed significant procedural gaps and operational challenges.\n\n### Operational Challenges in Law Enforcement\nThe first line of challenge lies in retraining law enforcement personnel. Police officers at local police stations must be trained to file First Information Reports (FIRs) under the correct sections of the BNS, which have been completely restructured. Additionally, the new codes place heavy emphasis on electronic records and digital forensics, requiring mandatory audio-video recording of searches and seizures. Without proper digital infrastructure and training, this requirement could lead to procedural errors that compromise prosecutions.\n\n### The Backlog & Judicial Burden\nThe judiciary is already grappling with a massive backlog of pending cases. During the transition period, courts will be forced to run parallel systems: prosecuting cases registered prior to the reform under the old codes, while processing new offenses under the new codes. This dual-track system will place an immense cognitive and administrative burden on magistrates, prosecutors, and defense counsels alike.\n\n### The Path Forward\nFor these legislative reforms to achieve their intended goals, the state must prioritize infrastructure development. This includes upgrading state forensic laboratories, establishing secure cloud repositories for digital evidence, and conducting comprehensive, nationwide training programs for all stakeholders in the criminal justice system. A legislative reform is only as good as its execution in the courts.",
                'category' => 'Criminal Law',
                'cover_image_url' => '/storage/blog_covers/criminal_reform_editorial.png',
                'tags' => ['criminal-law', 'reforms', 'BNS', 'BNSS'],
                'is_featured' => false,
                'is_published' => true,
                'views' => 1100,
                'reading_time_min' => 8,
            ],
        ];

        foreach ($posts as $post) {
            BlogPost::create($post);
        }
    }
}
