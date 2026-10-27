// Plain GET form so the range lives in the URL (shareable, back button works).
export function DateRange({ from, to }: { from: string; to: string }) {
  return (
    <form className="flex flex-wrap items-end gap-2">
      <div>
        <label className="label" htmlFor="from">
          From
        </label>
        <input className="input" type="date" id="from" name="from" defaultValue={from} />
      </div>
      <div>
        <label className="label" htmlFor="to">
          To
        </label>
        <input className="input" type="date" id="to" name="to" defaultValue={to} />
      </div>
      <button className="btn-quiet">Show</button>
    </form>
  );
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function readRange(sp: Record<string, string | string[] | undefined>, today: string) {
  const from = typeof sp.from === "string" && DAY.test(sp.from) ? sp.from : today;
  const to = typeof sp.to === "string" && DAY.test(sp.to) && sp.to >= from ? sp.to : from > today ? from : today;
  return { from, to };
}
