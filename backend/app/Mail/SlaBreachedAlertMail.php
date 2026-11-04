<?php

namespace App\Mail;

use App\Models\Complaint;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SlaBreachedAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Complaint $complaint
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "URGENT SLA BREACH: Complaint #{$this->complaint->tracking_number} ({$this->complaint->department->department_name})",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.sla_breached',
        );
    }
}
