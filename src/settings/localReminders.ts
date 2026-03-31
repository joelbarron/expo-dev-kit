import * as Notifications from "expo-notifications";

export type JBLocalReminderRule<TItem> = {
  key: string;
  offsetMinutes: number;
  getReferenceDate: (item: TItem) => Date | null;
  getTitle: (item: TItem) => string;
  getBody: (item: TItem) => string;
  getData?: (item: TItem) => Record<string, unknown>;
};

export type JBSyncLocalRemindersOptions<TItem> = {
  source: string;
  items: TItem[];
  rules: JBLocalReminderRule<TItem>[];
  getItemId: (item: TItem) => string;
  isEligible?: (item: TItem) => boolean;
};

const toReminderDate = (date: Date, offsetMinutes: number) =>
  new Date(date.getTime() - offsetMinutes * 60 * 1000);

const isValidFutureDate = (date: Date | null): date is Date => {
  if (!date) return false;
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() > Date.now();
};

export const syncJBLocalReminders = async <TItem>(
  options: JBSyncLocalRemindersOptions<TItem>,
) => {
  const source = String(options.source ?? "").trim();
  if (!source) return;

  const permissions = await Notifications.getPermissionsAsync();
  if (permissions.status !== "granted") {
    return;
  }

  const existing = await Notifications.getAllScheduledNotificationsAsync();
  const ownedIds = existing
    .filter(
      (request) => String(request.content?.data?.source ?? "").trim() === source,
    )
    .map((request) => request.identifier)
    .filter(Boolean);

  await Promise.all(
    ownedIds.map((identifier) =>
      Notifications.cancelScheduledNotificationAsync(identifier),
    ),
  );

  for (const item of options.items ?? []) {
    const itemId = String(options.getItemId(item) ?? "").trim();
    if (!itemId) continue;
    if (options.isEligible && !options.isEligible(item)) continue;

    for (const rule of options.rules ?? []) {
      const referenceDate = rule.getReferenceDate(item);
      if (!referenceDate) continue;
      const scheduleDate = toReminderDate(referenceDate, rule.offsetMinutes);
      if (!isValidFutureDate(scheduleDate)) continue;

      const data = {
        source,
        rule: rule.key,
        itemId,
        ...(rule.getData ? rule.getData(item) : {}),
      };

      await Notifications.scheduleNotificationAsync({
        content: {
          title: rule.getTitle(item),
          body: rule.getBody(item),
          sound: "default",
          data,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: scheduleDate,
        },
      });
    }
  }
};

