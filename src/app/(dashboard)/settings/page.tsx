export default function SettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-text-secondary mt-1">
          Configure your monitoring preferences
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">Notifications</h2>
          <p className="text-sm text-text-secondary">
            Email notification settings will be available in a future update.
            Configure alert thresholds and notification preferences here.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">GitHub Integration</h2>
          <p className="text-sm text-text-secondary">
            GitHub token configuration for dependency auditing will be available in a future update.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">Check Frequency</h2>
          <p className="text-sm text-text-secondary">
            Global check frequency and scheduling options will be available in a future update.
          </p>
        </div>
      </div>
    </div>
  );
}
