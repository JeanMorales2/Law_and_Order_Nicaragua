namespace LegalNic.Application.Notifications;

public sealed class NotificationOptions
{
    public const string SectionName = "Notifications";

    public string ProviderName { get; set; } = "MailKit";

    public string FromEmail { get; set; } = string.Empty;

    public string FromName { get; set; } = "LegalNic";

    public string SmtpHost { get; set; } = string.Empty;

    public int SmtpPort { get; set; } = 587;

    public bool UseStartTls { get; set; } = true;

    public string SmtpUsername { get; set; } = string.Empty;

    public string SmtpPassword { get; set; } = string.Empty;

    public int ChatEmailThrottleMinutes { get; set; } = 10;
}
