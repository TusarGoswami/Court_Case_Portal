<?php

return [
    /*
    | Used only by `php artisan ecourt:ensure-primary-judge` when creating the demo judge login.
    | Set in .env — never commit real secrets.
    */
    'primary_judge_password' => env('PRIMARY_JUDGE_PASSWORD'),

    'primary_judge_email' => env('PRIMARY_JUDGE_EMAIL', 'judge123@gmail.com'),
];
