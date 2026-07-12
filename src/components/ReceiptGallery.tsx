import Link from "next/link";
import Badge from "@/components/ui/Badge";

export type ReceiptItem = {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string | null;
  address: string | undefined;
  imageUrl: string | null;
  needsReview: boolean;
};

function Thumbnail({ imageUrl, className }: { imageUrl: string | null; className: string }) {
  return (
    <div className={`flex items-center justify-center overflow-hidden bg-neutral-bg ${className}`}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-2xl text-muted">🧾</span>
      )}
    </div>
  );
}

export default function ReceiptGallery({
  items,
  view,
}: {
  items: ReceiptItem[];
  view: "grid" | "list";
}) {
  if (view === "list") {
    return (
      <ul className="space-y-2">
        {items.map((item) => {
          const row = (
            <div className="flex items-center gap-3 rounded-2xl bg-surface p-3 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-md">
              <Thumbnail imageUrl={item.imageUrl} className="h-12 w-12 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">
                  {item.description ?? item.category}
                </p>
                <p className="truncate text-xs text-muted">
                  {item.address} · {item.category} · {item.date}
                </p>
              </div>
              {item.needsReview && <Badge variant="warning">Needs review</Badge>}
              <span className="shrink-0 font-medium text-foreground">
                ${Number(item.amount).toFixed(2)}
              </span>
            </div>
          );

          return (
            <li key={item.id}>
              {item.imageUrl ? <Link href={`/receipts/${item.id}`}>{row}</Link> : row}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {items.map((item) => {
        const card = (
          <div className="rounded-2xl bg-surface p-3 text-xs shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-md">
            <Thumbnail imageUrl={item.imageUrl} className="mb-2 aspect-square rounded-md" />
            {item.needsReview && (
              <div className="mb-1">
                <Badge variant="warning">Needs review</Badge>
              </div>
            )}
            <p className="truncate font-medium text-foreground">
              {item.description ?? item.category}
            </p>
            <p className="truncate text-muted">
              {item.address} · ${Number(item.amount).toFixed(2)}
            </p>
            <p className="text-muted">{item.date}</p>
          </div>
        );

        return (
          <div key={item.id}>
            {item.imageUrl ? <Link href={`/receipts/${item.id}`}>{card}</Link> : card}
          </div>
        );
      })}
    </div>
  );
}
