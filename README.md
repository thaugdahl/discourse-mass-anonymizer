# Mass Anonymizer

A Discourse plugin for bulk anonymization of inactive users, designed for platforms with GDPR obligations — such as course platforms, educational institutions, or organizations that must periodically purge personal data while preserving community content.

## Use Case

Platforms where users complete a course or engagement period and then become inactive face a recurring GDPR compliance challenge: posts and discussions have archival value, but personal data must not be retained indefinitely. This plugin addresses that by letting administrators anonymize inactive users in bulk on an annual or bi-annual basis — removing personal identifying information while leaving all posts and topics intact.

## How It Works

1. Administrator navigates to **Admin → Plugins → Mass Anonymize**
2. Clicks **Get Eligible Users** to load inactive users who meet the configured threshold
3. Reviews the list, selects users individually or all at once
4. Clicks **Anonymize Selected** and confirms the irreversible action
5. The plugin processes users in small batches, showing live progress per user

Anonymization delegates to Discourse's built-in `UserAnonymizer`, which replaces the user's name, username, email, and other identifying fields with anonymized values. All posts and topics remain associated with the anonymized account.

## Eligibility Criteria

A user is eligible for anonymization if **all** of the following are true:

- Has a recorded `last_seen_at` date
- Has not been seen within the configured threshold (default: 365 days)
- Is not an admin
- Is not a moderator

Eligibility is re-checked at anonymization time to prevent race conditions between selection and processing.

## Settings

| Setting | Default | Description |
|---|---|---|
| `mass_anonymizer_enabled` | `false` | Master toggle to enable the plugin |
| `manon_min_time_since_last_seen` | `365` | Days of inactivity before a user is eligible for anonymization |

Settings are found under **Admin → Settings → Mass Anonymize**.

## Installation

Follow the standard Discourse plugin installation process:

```bash
cd /var/discourse
./launcher enter app
cd /var/www/discourse
git clone https://github.com/thaugdahl/discourse-mass-anonymizer.git plugins/mass-anonymizer
```

Then rebuild:

```bash
./launcher rebuild app
```

## Technical Notes

- **Batch size:** The frontend sends users in segments of 5 per request to avoid overloading the server
- **Server-side limit:** A single request may not exceed 500 users
- **Audit trail:** Admin actions are logged via Discourse's `StaffActionLogger`
- **Irreversibility:** Anonymization cannot be undone. The confirmation dialog explicitly warns the admin before proceeding

## Requirements

- Discourse 2.7.0 or higher
- Admin access to configure and operate the plugin
