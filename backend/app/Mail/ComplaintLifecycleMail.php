<?php

namespace App\Mail;

use App\Models\Complaint;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ComplaintLifecycleMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Complaint $complaint,
        public string $stage,
        public string $stageTitle,
        public string $messageBody,
        public ?string $remarks = null,
        public ?string $nextStep = null,
        public ?string $badgeColor = null
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "FixMyCity Update: #{$this->complaint->tracking_number} - {$this->stageTitle}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.complaint-lifecycle',
        );
    }
}
