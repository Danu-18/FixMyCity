<?php

namespace App\Mail;

use App\Models\Complaint;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ComplaintStatusUpdatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Complaint $complaint,
        public string $oldStatus,
        public string $newStatus,
        public ?string $notes = null
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "FixMyCity: Complaint #{$this->complaint->tracking_number} Status Updated to {$this->newStatus}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.complaint_status_updated',
        );
    }
}
