import { monthLabel, monthKey } from "@/lib/months";

export default function MonthSelect({
  months,
  name = "month",
  defaultValue,
}: {
  months: Date[];
  name?: string;
  defaultValue?: string;
}) {
  return (
    <select name={name} defaultValue={defaultValue ?? monthKey(months[0])}>
      {months.map((month) => (
        <option key={monthKey(month)} value={monthKey(month)}>
          {monthLabel(month)}
        </option>
      ))}
    </select>
  );
}
